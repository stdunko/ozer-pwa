import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Funnel } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteOrder, getMyOrders } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import OrderItem from "../components/OrderItem";
import OrderFiltersModal from "../components/OrderFiltersModal";
import { defaultOrderFilters, type Order, type OrderFiltersState } from "../types/order";
import { filterOrders, hasActiveOrderFilters } from "../utils/orderUtils";
import { ORDERS_POLL_INTERVAL_MS, reportOrderStatusChanges } from "../utils/orderSync";

const OrderScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showApiError, showSuccess, showInfo } = useNotifier();
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]);
  const [filters, setFilters] = useState<OrderFiltersState>(defaultOrderFilters);
  const [isFiltersVisible, setFiltersVisible] = useState(false);
  const [visibleGeoId, setVisibleGeoId] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  ordersRef.current = orders;
  const filteredOrders = useMemo(() => filterOrders(orders, filters), [orders, filters]);
  const filtersActive = hasActiveOrderFilters(filters);

  const loadOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      const { response, error } = await getMyOrders();
      if (error) {
        if (!options?.silent) {
          showApiError(error, "errorLoadOrders");
        }
      } else if (response?.data) {
        const nextOrders = response.data as Order[];
        if (options?.silent) {
          reportOrderStatusChanges(ordersRef.current, nextOrders, ({ categoryName, statusKey }) => {
            showInfo(t("orderStatusUpdated", { category: categoryName, status: t(statusKey) }));
          });
        }
        setOrders(nextOrders);
      }
      setInitialLoading(false);
    },
    [showApiError, showInfo, t]
  );

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(() => loadOrders({ silent: true }), ORDERS_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadOrders]);

  const handleDeleteOrder = useCallback(
    async (orderId: number) => {
      setDeletingOrderId(orderId);
      const { error } = await deleteOrder(orderId);
      if (error) {
        showApiError(error, "errorDeleteOrder");
      } else {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        showSuccess("successOrderDeleted");
      }
      setDeletingOrderId(null);
    },
    [showApiError, showSuccess]
  );

  const listEmptyText =
    orders.length > 0 && filtersActive ? t("ordersNotFound") : t("yourOrdersEmpty");

  return (
    <div className="screen">
      <AppHeader
        title={t("orders")}
        right={
          <button type="button" className="icon-btn relative" onClick={() => setFiltersVisible(true)}>
            <Funnel size={22} fill={filtersActive ? "#00656D" : "none"} />
            {filtersActive ? <span className="filter-badge" /> : null}
          </button>
        }
      />
      {initialLoading && orders.length === 0 ? (
        <div className="loader">
          <span className="spinner" />
        </div>
      ) : (
        <div className="scroll pad">
          {filteredOrders.length === 0 ? (
            <p className="empty">{listEmptyText}</p>
          ) : (
            filteredOrders.map((item) => (
              <OrderItem
                key={item.id}
                item={item}
                isGeoVisible={visibleGeoId === item.id}
                setVisibleGeoId={setVisibleGeoId}
                isDeleting={deletingOrderId === item.id}
                onDeletePress={handleDeleteOrder}
                onMessagePress={(chat) => navigate("/app/chats/" + (chat as { id: string }).id, { state: { chat } })}
              />
            ))
          )}
        </div>
      )}
      <OrderFiltersModal
        isVisible={isFiltersVisible}
        orders={orders}
        filters={filters}
        onClose={() => setFiltersVisible(false)}
        onApply={setFilters}
      />
    </div>
  );
};

export default OrderScreen;
