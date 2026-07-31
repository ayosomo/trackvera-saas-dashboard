import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../../api/orders";

export const ordersQueryKey = ["orders"] as const;

export function useOrdersQuery() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: ({ signal }) => getOrders({ signal }),
  });
}
