import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Funnel } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteOrder } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import OrderItem from "../components/OrderItem";
import OrderFiltersModal from "../components/OrderFiltersModal";
import PullToRefresh from "../components/PullToRefresh";
import PrimaryButton from "../components/PrimaryButton";
import { defaultOrderFilters, type OrderFiltersState } from "../types/order";
import { filterOrders, hasActiveOrderFilters } from "../utils/orderUtils";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { removeOrder, requestLiveRefresh } from "../store/liveSlice";

const OrderScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showApiError, showSuccess } = useNotifier();
  const orders = useAppSelector((state) => state.live.orders);
  const initialLoading = useAppSelector((state) => state.live.ordersLoading);
  const [filters, setFilters] = useState<OrderFiltersState>(defaultOrderFilters);
  const [isFiltersVisible, setFiltersVisible] = useState(false);
  const [visibleGeoId, setVisibleGeoId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  const filteredOrders = useMemo(() => filterOrders(orders, filters), [orders, filters]);
  const filtersActive = hasActiveOrderFilters(filters);

  const handleDeleteOrder = useCallback(
    async (orderId: number) => {
      setDeletingOrderId(orderId);
      const { error } = await deleteOrder(orderId);
      if (error) {
        showApiError(error, "errorDeleteOrder");
      } else {
        dispatch(removeOrder(orderId));
        showSuccess("successOrderDeleted");
      }
      setDeletingOrderId(null);
    },
    [dispatch, showApiError, showSuccess]
  );

  const onRefresh = async () => {
    dispatch(requestLiveRefresh());
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  const listEmptyText =
    orders.length > 0 && filtersActive ? t("ordersNotFound") : t("yourOrdersEmpty");

  return (
    <div className="screen">
      <AppHeader
        title={t("orders")}
        right={
          <button type="button" className="icon-btn relative" onClick={() => setFiltersVisible(true)}>
            <Funnel size={22} fill={filtersActive ? "currentColor" : "none"} />
            {filtersActive ? <span className="filter-badge" /> : null}
          </button>
        }
      />
      {initialLoading && orders.length === 0 ? (
        <div className="loader">
          <span className="spinner" />
        </div>
      ) : (
        <PullToRefresh onRefresh={onRefresh} className="pad">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <ClipboardList size={32} />
              </div>
              <p className="empty">{listEmptyText}</p>
              {!filtersActive ? (
                <PrimaryButton title={t("createOrder")} onPress={() => navigate("/app/categories")} />
              ) : null}
            </div>
          ) : (
            filteredOrders.map((item) => (
              <OrderItem
                key={item.id}
                item={item}
                isGeoVisible={visibleGeoId === item.id}
                setVisibleGeoId={setVisibleGeoId}
                isDeleting={deletingOrderId === item.id}
                onDeletePress={handleDeleteOrder}
                onOpen={() => navigate(`/app/orders/${item.id}`)}
                onMessagePress={(chat) => navigate("/app/chats/" + (chat as { id: string }).id, { state: { chat } })}
              />
            ))
          )}
        </PullToRefresh>
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
