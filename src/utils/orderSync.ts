import type { Order, OrderStatus } from "../types/order";

export const ORDERS_POLL_INTERVAL_MS = 20_000;

export const getOrderStatusLabelKey = (status: OrderStatus) => {
  if (status === "NEW") {
    return "orderStatus1";
  }
  if (status === "CONFIRMED") {
    return "orderStatus2";
  }
  if (status === "COMPLETED") {
    return "orderStatus3";
  }
  return "orderStatus0";
};

type StatusChangeHandler = (change: {
  orderId: number;
  categoryName: string;
  statusKey: string;
}) => void;

export const reportOrderStatusChanges = (
  previousOrders: Order[],
  nextOrders: Order[],
  onChange: StatusChangeHandler
) => {
  nextOrders.forEach((order) => {
    const previous = previousOrders.find((item) => item.id === order.id);

    if (previous && previous.status !== order.status) {
      onChange({
        orderId: order.id,
        categoryName: order.category?.name ?? "",
        statusKey: getOrderStatusLabelKey(order.status),
      });
    }
  });
};
