import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { createOrder, updateOrder } from "./api/orders";
import { FeedbackMessage } from "./components/FeedbackMessage";
import { DashboardContent } from "./features/dashboard/DashboardContent";
import {
  countOpenExceptions,
  filterOrders,
  initialOrderFilters,
} from "./features/dashboard/selectors";
import {
  NotificationCentre,
  type OrderNotification,
} from "./features/orders/NotificationCentre";
import { OrderDetailModal } from "./features/orders/OrderDetailModal";
import {
  advanceOrder,
  getNextStage,
  getStage,
} from "./features/orders/orderJourney";
import { OrderModal } from "./features/orders/OrderModal";
import { ordersQueryKey, useOrdersQuery } from "./features/orders/orderQueries";
import { formatLongDate } from "./lib/formatters";
import type {
  OrderBlocker,
  Order,
  OrderDraft,
  OrderFilters as Filters,
} from "./types";

interface MutationContext {
  previousOrders: Order[];
  optimisticId?: string;
}

interface UpdateVariables {
  order: Order;
  notification: {
    title: string;
    detail: string;
  };
}

const initialNotifications: OrderNotification[] = [
  {
    id: "notification-1",
    owner: "Rowan Bell",
    title: "Milestone reached · Activation",
    detail: "Fieldwork Energy moved into activation and service testing.",
    timestamp: "Today, 08:30",
    unread: true,
  },
  {
    id: "notification-2",
    owner: "Theo Grant",
    title: "Exception assigned · ECC",
    detail:
      "Veridian Bank requires customer approval for £8,400 construction charges.",
    timestamp: "Today, 09:15",
    unread: true,
  },
  {
    id: "notification-3",
    owner: "Maya Chen",
    title: "Milestone reached · Handover",
    detail: "CivicWorks completed service handover and moved into support.",
    timestamp: "18 Jul, 17:00",
    unread: false,
  },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function App() {
  const queryClient = useQueryClient();
  const newOrderButtonRef = useRef<HTMLButtonElement>(null);
  const [filters, setFilters] = useState<Filters>(initialOrderFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    null,
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<OrderNotification[]>(initialNotifications);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const ordersQuery = useOrdersQuery();

  const orderMutation = useMutation<
    Order,
    Error,
    OrderDraft,
    MutationContext
  >({
    mutationFn: createOrder,
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKey });
      const previousOrders =
        queryClient.getQueryData<Order[]>(ordersQueryKey) ?? [];
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticOrder: Order = {
        ...draft,
        id: optimisticId,
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Order[]>(ordersQueryKey, [
        optimisticOrder,
        ...previousOrders,
      ]);
      return { previousOrders, optimisticId };
    },
    onError: (_error, _draft, context) => {
      if (context) {
        queryClient.setQueryData(ordersQueryKey, context.previousOrders);
      }
      setFeedback({
        kind: "error",
        message:
          "The order tracker was not saved. Your existing portfolio is unchanged.",
      });
    },
    onSuccess: (createdOrder, _draft, context) => {
      queryClient.setQueryData<Order[]>(ordersQueryKey, (orders = []) =>
        orders.map((order) =>
          order.id === context?.optimisticId ? createdOrder : order,
        ),
      );
      addNotification(
        createdOrder.owner,
        "New order tracker assigned",
        `${createdOrder.customer} was created at ${getStage(createdOrder.currentStage).label}.`,
      );
      setFeedback({
        kind: "success",
        message: `${createdOrder.customer} tracker is ready and ${createdOrder.owner} was notified.`,
      });
      closeModal();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });

  const updateMutation = useMutation<
    Order,
    Error,
    UpdateVariables,
    MutationContext
  >({
    mutationFn: ({ order }) => updateOrder(order),
    onMutate: async ({ order }) => {
      await queryClient.cancelQueries({ queryKey: ordersQueryKey });
      const previousOrders =
        queryClient.getQueryData<Order[]>(ordersQueryKey) ?? [];
      queryClient.setQueryData<Order[]>(ordersQueryKey, (orders = []) =>
        orders.map((item) => (item.id === order.id ? order : item)),
      );
      return { previousOrders };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(ordersQueryKey, context.previousOrders);
      }
      setFeedback({
        kind: "error",
        message: "The order update failed and has been rolled back.",
      });
    },
    onSuccess: (savedOrder, variables) => {
      queryClient.setQueryData<Order[]>(ordersQueryKey, (orders = []) =>
        orders.map((item) =>
          item.id === savedOrder.id ? savedOrder : item,
        ),
      );
      addNotification(
        savedOrder.owner,
        variables.notification.title,
        variables.notification.detail,
      );
      setFeedback({
        kind: "success",
        message: `${savedOrder.owner} was notified of the order update.`,
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
  });

  const orders = useMemo(
    () => ordersQuery.data ?? [],
    [ordersQuery.data],
  );
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;

  const filteredOrders = useMemo(
    () => filterOrders(orders, filters),
    [filters, orders],
  );
  const openExceptions = countOpenExceptions(orders);

  function addNotification(owner: string, title: string, detail: string) {
    setNotifications((current) => [
      {
        id: `notification-${Date.now()}`,
        owner,
        title,
        detail,
        timestamp: "Just now",
        unread: true,
      },
      ...current,
    ]);
  }

  function openModal() {
    orderMutation.reset();
    setFeedback(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    window.setTimeout(() => newOrderButtonRef.current?.focus(), 0);
  }

  function submitOrder(draft: OrderDraft) {
    setFeedback(null);
    orderMutation.mutate(draft);
  }

  function advanceMilestone(order: Order) {
    const nextStage = getNextStage(order.currentStage);
    if (!nextStage) return;
    const updated = advanceOrder(order);
    updateMutation.mutate({
      order: updated,
      notification: {
        title: `Milestone reached · ${nextStage.shortLabel}`,
        detail: `${order.customer} moved to ${nextStage.label}. ${nextStage.nextAction}`,
      },
    });
  }

  function addBlocker(order: Order, blocker: OrderBlocker) {
    const updated: Order = {
      ...order,
      blockers: [blocker, ...order.blockers],
      openRisks: order.openRisks + 1,
      status: ["ECC", "Wayleave", "Survey failure", "Network capacity"].includes(
        blocker.type,
      )
        ? "Blocked"
        : "At risk",
    };
    updateMutation.mutate({
      order: updated,
      notification: {
        title: `Exception assigned · ${blocker.type}`,
        detail: `${blocker.accountableParty} is accountable. ${blocker.nextAction}`,
      },
    });
  }

  function resolveBlocker(order: Order, blockerId: string) {
    const blockers = order.blockers.map((blocker) =>
      blocker.id === blockerId
        ? ({ ...blocker, status: "Resolved" } as const)
        : blocker,
    );
    const remaining = blockers.filter(
      (blocker) => blocker.status === "Open",
    ).length;
    const resolved = order.blockers.find(
      (blocker) => blocker.id === blockerId,
    );
    updateMutation.mutate({
      order: {
        ...order,
        blockers,
        openRisks: remaining,
        status: remaining === 0 ? "On track" : order.status,
      },
      notification: {
        title: `Exception resolved · ${resolved?.type ?? "Order issue"}`,
        detail: `${order.customer} can continue through ${getStage(order.currentStage).label}.`,
      },
    });
  }

  const hasFilters =
    filters.search.trim().length > 0 || filters.status !== "All statuses";
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="sidebar" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="FlowOps home">
          <span className="brand__mark" aria-hidden="true">
            F
          </span>
          <span>FlowOps</span>
        </a>
        <p className="sidebar__workspace-label">MSP Order Control</p>
        <nav>
          <a className="nav-link nav-link--active" href="#overview">
            <span aria-hidden="true">⌂</span>
            Control tower
          </a>
          <a className="nav-link" href="#orders">
            <span aria-hidden="true">▦</span>
            Orders
            <span className="nav-link__count">{orders.length}</span>
          </a>
          <a className="nav-link" href="#orders">
            <span aria-hidden="true">△</span>
            Exceptions
            <span className="nav-link__count">{openExceptions}</span>
          </a>
          <a className="nav-link" href="#raci">
            <span aria-hidden="true">◎</span>
            RACI ownership
          </a>
        </nav>
        <div className="sidebar__footer">
          <div className="team-avatar" aria-hidden="true">
            DO
          </div>
          <div>
            <strong>Delivery Ops</strong>
            <span>Order coordination</span>
          </div>
          <button hidden type="button" aria-label="Workspace options">
            ···
          </button>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        <header className="page-header" id="overview">
          <div>
            <p className="eyebrow">{formatLongDate(new Date())}</p>
            <h1>Order control tower</h1>
            <p>
              One journey, three supply-chain parties, and no ambiguity about
              the next move.
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="notification-button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label={`Open notifications, ${unreadCount} unread`}
            >
              <span aria-hidden="true">♢</span>
              {unreadCount > 0 && <strong>{unreadCount}</strong>}
            </button>
            <button
              ref={newOrderButtonRef}
              type="button"
              className="button button--primary new-order-button"
              onClick={openModal}
            >
              <span aria-hidden="true">＋</span>
              New order
            </button>
          </div>
        </header>

        <FeedbackMessage
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />

        {ordersQuery.isLoading ? (
          <DashboardSkeleton />
        ) : ordersQuery.isError ? (
          <div className="query-state" role="alert">
            <span aria-hidden="true">!</span>
            <h2>We couldn’t load the order portfolio</h2>
            <p>{getErrorMessage(ordersQuery.error)}</p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => void ordersQuery.refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <DashboardContent
            orders={orders}
            filteredOrders={filteredOrders}
            filters={filters}
            hasFilters={hasFilters}
            updatedAt={ordersQuery.dataUpdatedAt}
            isRefreshing={ordersQuery.isFetching}
            onFiltersChange={setFilters}
            onClearFilters={() => setFilters(initialOrderFilters)}
            onOpenOrder={(order) => setSelectedOrderId(order.id)}
            onRefresh={() => void ordersQuery.refetch()}
          />
        )}
      </main>

      <OrderModal
        isOpen={isModalOpen}
        isSubmitting={orderMutation.isPending}
        submitError={
          orderMutation.isError
            ? getErrorMessage(orderMutation.error)
            : null
        }
        onClose={closeModal}
        onSubmit={submitOrder}
      />

      <OrderDetailModal
        order={selectedOrder}
        isUpdating={updateMutation.isPending}
        onClose={() => setSelectedOrderId(null)}
        onAdvance={advanceMilestone}
        onAddBlocker={addBlocker}
        onResolveBlocker={resolveBlocker}
      />

      <NotificationCentre
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((items) =>
            items.map((item) => ({ ...item, unread: false })),
          )
        }
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="skeleton-summary">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
      <div className="skeleton-table">
        <div />
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}
