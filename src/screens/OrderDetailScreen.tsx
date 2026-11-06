import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteOrder } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import OrderItem from "../components/OrderItem";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { removeOrder } from "../store/liveSlice";

const OrderDetailScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const dispatch = useAppDispatch();
  const { showApiError, showSuccess } = useNotifier();
  const id = Number(orderId);
  const order = useAppSelector((state) => state.live.orders.find((item) => item.id === id));
  const [visibleGeoId, setVisibleGeoId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteOrder = useCallback(
    async (nextId: number) => {
      setDeleting(true);
      const { error } = await deleteOrder(nextId);
      if (error) {
        showApiError(error, "errorDeleteOrder");
        setDeleting(false);
        return;
      }
      dispatch(removeOrder(nextId));
      showSuccess("successOrderDeleted");
      navigate("/app/orders", { replace: true });
    },
    [dispatch, navigate, showApiError, showSuccess]
  );

  return (
    <div className="screen">
      <AppHeader title={order ? t("orderNumber", { n: order.id }) : t("orders")} back />
      {!order ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ClipboardList size={32} />
          </div>
          <p className="empty">{t("orderNotFound")}</p>
        </div>
      ) : (
        <div className="scroll pad">
          <OrderItem
            item={order}
            isGeoVisible={visibleGeoId === order.id}
            setVisibleGeoId={setVisibleGeoId}
            isDeleting={deleting}
            onDeletePress={handleDeleteOrder}
            onMessagePress={(chat) => navigate("/app/chats/" + (chat as { id: string }).id, { state: { chat } })}
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetailScreen;
