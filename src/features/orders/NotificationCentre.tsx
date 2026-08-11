import { useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

export interface OrderNotification {
  id: string;
  owner: string;
  title: string;
  detail: string;
  timestamp: string;
  unread: boolean;
}

interface NotificationCentreProps {
  isOpen: boolean;
  notifications: OrderNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function NotificationCentre({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
}: NotificationCentreProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return createPortal(
    <div
      className="notification-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="notification-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        onKeyDown={handleKeyDown}
      >
        <header>
          <div>
            <p className="eyebrow">Owner updates</p>
            <h2 id="notifications-title">Notifications</h2>
          </div>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            autoFocus
          >
            ×
          </button>
        </header>
        <div className="notification-toolbar">
          <span>{notifications.filter((item) => item.unread).length} unread</span>
          <button type="button" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        </div>
        <div className="notification-list">
          {notifications.length === 0 ? (
            <p className="notification-empty">No milestone updates yet.</p>
          ) : (
            notifications.map((notification) => (
              <article
                className={`notification-item ${
                  notification.unread ? "notification-item--unread" : ""
                }`}
                key={notification.id}
              >
                <span className="notification-item__icon" aria-hidden="true">
                  {notification.title.includes("Exception") ? "!" : "✓"}
                </span>
                <div>
                  <div>
                    <strong>{notification.title}</strong>
                    {notification.unread && <span>New</span>}
                  </div>
                  <p>{notification.detail}</p>
                  <small>
                    To {notification.owner} · {notification.timestamp}
                  </small>
                </div>
              </article>
            ))
          )}
        </div>
        <footer>
          <p>
            Production integrations can deliver the same event through email,
            Teams, or a service desk.
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
