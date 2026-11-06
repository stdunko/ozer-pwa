import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList, MessageCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { deleteOrder } from "../services/api";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import CategoryIcon from "../components/CategoryIcon";
import MapView from "../components/MapView";
import PersonAvatar from "../components/PersonAvatar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { removeOrder } from "../store/liveSlice";
import type { Order } from "../types/order";
import { formatOrderDate } from "../utils/orderUtils";
import { openOrCreateOrderChat } from "../utils/orderChat";

const hasCoords = (lat?: number, lng?: number) =>
  lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

const canDeleteOrder = (item: Order) => item.status === "NEW" && !item.executor && !item.executorId;

const OrderDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const dispatch = useAppDispatch();
  const { showApiError, showSuccess } = useNotifier();
  const user = useAppSelector((state) => state.user);
  const id = Number(orderId);
  const order = useAppSelector((state) => state.live.orders.find((item) => item.id === id));
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleDeleteOrder = useCallback(async () => {
    if (!order) {
      return;
    }
    setDeleting(true);
    const { error } = await deleteOrder(order.id);
    if (error) {
      showApiError(error, "errorDeleteOrder");
      setDeleting(false);
      return;
    }
    dispatch(removeOrder(order.id));
    showSuccess("successOrderDeleted");
    navigate("/app/orders", { replace: true });
  }, [dispatch, navigate, order, showApiError, showSuccess]);

  const handlePressChat = async () => {
    if (!order?.executor || chatLoading) {
      return;
    }
    setChatLoading(true);
    const chatData = await openOrCreateOrderChat({
      myId: user.id,
      otherId: order.executor.id,
      orderId: order.id,
      orderCategory: order.category?.name,
      participants: [
        { user_id: user.id, name: user.name, photo: user.photo },
        {
          executor_id: order.executor.id,
          name: order.executor.name || "No ext name",
          photo: order.executor.photo,
        },
      ],
    });
    setChatLoading(false);
    navigate("/app/chats/" + (chatData as { id: string }).id, { state: { chat: chatData } });
  };

  const statusClass =
    order?.status === "NEW"
      ? "badge-new"
      : order?.status === "CONFIRMED"
        ? "badge-work"
        : order?.status === "COMPLETED"
          ? "badge-done"
          : "badge-cancel";

  const statusLabel =
    order?.status === "NEW"
      ? t("orderStatus1")
      : order?.status === "CONFIRMED"
        ? t("orderStatus2")
        : order?.status === "COMPLETED"
          ? t("orderStatus3")
          : t("orderStatus0");

  const createdAtLabel = order ? formatOrderDate(order, i18n.language) : null;
  const showMap = order ? hasCoords(order.latitude, order.longitude) : false;

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
        <div className="scroll">
          {showMap ? (
            <div className="order-detail-map">
              <MapView
                latitude={order.latitude as number}
                longitude={order.longitude as number}
                markers={[{ latitude: order.latitude as number, longitude: order.longitude as number }]}
                interactive
              />
            </div>
          ) : null}
          <div className="order-detail-body">
            <div className="order-detail-hero">
              <div className="order-detail-cat-icon">
                <CategoryIcon categoryName={order.category?.name} size={26} />
              </div>
              <div className="order-detail-hero-text">
                <div className="order-detail-cat">{order.category?.name}</div>
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
              </div>
            </div>
            <div className="order-detail-price">{order.price} ₪</div>
            {createdAtLabel ? (
              <div className="order-detail-meta">
                {t("orderCreatedAt")}: {createdAtLabel}
              </div>
            ) : null}
            <div className="order-detail-block">
              <div className="order-detail-label">{t("description")}</div>
              <p className="order-detail-text">{order.description}</p>
            </div>
            {order.executor ? (
              <div className="order-detail-block order-detail-person">
                <PersonAvatar
                  className="order-detail-avatar"
                  name={order.executor.name}
                  photo={order.executor.photo}
                  executorId={order.executor.id}
                />
                <div>
                  <div className="order-detail-label">{t("executor")}</div>
                  <div className="order-detail-name">{order.executor.name}</div>
                  {order.executor.phone ? <div className="order-detail-meta">{order.executor.phone}</div> : null}
                </div>
              </div>
            ) : null}
            <div className="order-detail-actions">
              {order.status !== "NEW" && order.executor ? (
                <button type="button" className="btn btn-primary" onClick={() => void handlePressChat()} disabled={chatLoading}>
                  {chatLoading ? <span className="spinner" /> : <><MessageCircle size={20} /> {t("goToChat")}</>}
                </button>
              ) : null}
              {canDeleteOrder(order) ? (
                <button type="button" className="btn btn-danger" disabled={deleting} onClick={() => setConfirmDelete(true)}>
                  {deleting ? <span className="spinner" /> : <><Trash2 size={18} /> {t("deleteOrder")}</>}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {confirmDelete ? (
        <div className="modal-backdrop center" onClick={() => setConfirmDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="sheet-title">{t("deleteOrderTitle")}</h3>
            <p className="hint" style={{ marginTop: 12 }}>
              {t("deleteOrderConfirm")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setConfirmDelete(false);
                  void handleDeleteOrder();
                }}
              >
                {t("deleteOrder")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderDetailScreen;
