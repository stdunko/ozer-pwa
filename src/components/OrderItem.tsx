import { useState } from "react";
import { ChevronRight, MessageCircle, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../store/hooks";
import type { Order } from "../types/order";
import { formatOrderDate } from "../utils/orderUtils";
import { openOrCreateOrderChat } from "../utils/orderChat";
import ExecutorGeo from "./ExecutorGeo";
import PersonAvatar from "./PersonAvatar";

type OrderItemProps = {
  item: Order;
  isGeoVisible: boolean;
  setVisibleGeoId: (id: number | null) => void;
  onMessagePress?: (chat: unknown) => void;
  onDeletePress?: (orderId: number) => void;
  onOpen?: () => void;
  isDeleting?: boolean;
};

const canDeleteOrder = (item: Order) => item.status === "NEW" && !item.executor && !item.executorId;

const OrderItem = ({
  item,
  isGeoVisible,
  setVisibleGeoId,
  onMessagePress,
  onDeletePress,
  onOpen,
  isDeleting = false,
}: OrderItemProps) => {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((state) => state.user);
  const createdAtLabel = formatOrderDate(item, i18n.language);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusClass =
    item.status === "NEW"
      ? "badge-new"
      : item.status === "CONFIRMED"
        ? "badge-work"
        : item.status === "COMPLETED"
          ? "badge-done"
          : "badge-cancel";

  const statusLabel =
    item.status === "NEW"
      ? t("orderStatus1")
      : item.status === "CONFIRMED"
        ? t("orderStatus2")
        : item.status === "COMPLETED"
          ? t("orderStatus3")
          : t("orderStatus0");

  async function handlePressChat() {
    if (!item.executor) {
      return;
    }

    const chatData = await openOrCreateOrderChat({
      myId: user.id,
      otherId: item.executor.id,
      orderId: item.id,
      orderCategory: item.category?.name,
      participants: [
        { user_id: user.id, name: user.name, photo: user.photo },
        { executor_id: item.executor.id, name: item.executor.name || "No ext name", photo: item.executor.photo },
      ],
    });
    onMessagePress?.(chatData);
  }

  return (
    <div className="order-card">
      <div className="order-top">
        {onOpen ? (
          <button type="button" className="order-open" onClick={onOpen} aria-label={t("openOrder")}>
            <span>
              <div className="order-no">{t("orderNumber", { n: item.id })}</div>
              <div className="order-cat">{item.category.name}</div>
            </span>
            <ChevronRight size={18} className="order-open-chevron" />
          </button>
        ) : (
          <div>
            <div className="order-no">{t("orderNumber", { n: item.id })}</div>
            <div className="order-cat">{item.category.name}</div>
          </div>
        )}
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
      </div>
      {createdAtLabel ? (
        <div className="muted">
          {t("orderCreatedAt")}: {createdAtLabel}
        </div>
      ) : null}
      <p className="order-desc">{item.description}</p>
      <button type="button" className="geo-btn" onClick={() => setVisibleGeoId(isGeoVisible ? null : item.id)}>
        <MapPin size={18} />
        {t("openGeo")}
      </button>
      {item.executor ? (
        <div className="executor-box">
          <PersonAvatar
            className="executor-avatar"
            name={item.executor.name}
            photo={item.executor.photo}
            executorId={item.executor.id}
          />
          <div>
            <div className="muted">{t("executor")}</div>
            <div className="executor-name">{item.executor.name}</div>
            <div className="muted">{item.executor.phone}</div>
          </div>
        </div>
      ) : null}
      <div className="order-footer">
        <div className="price">{item.price} ₪</div>
        {item.status !== "NEW" ? (
          <button type="button" className="chat-icon-btn" onClick={handlePressChat}>
            <MessageCircle size={22} />
          </button>
        ) : null}
      </div>
      {canDeleteOrder(item) ? (
        <button
          type="button"
          className="btn btn-danger-outline delete-btn"
          disabled={isDeleting}
          onClick={() => setConfirmDelete(true)}
        >
          {isDeleting ? <span className="spinner" /> : t("deleteOrder")}
        </button>
      ) : null}
      <ExecutorGeo
        latitude={item.latitude || 0}
        longitude={item.longitude || 0}
        isVisible={isGeoVisible}
        onClose={() => setVisibleGeoId(null)}
      />
      {confirmDelete ? (
        <div className="modal-backdrop center" onClick={() => setConfirmDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="sheet-title">{t("deleteOrderTitle")}</h3>
            <p className="hint" style={{ marginTop: 12 }}>{t("deleteOrderConfirm")}</p>
            <PrimaryishCancel tCancel={t("cancel")} tDelete={t("deleteOrder")} onCancel={() => setConfirmDelete(false)} onDelete={() => { setConfirmDelete(false); onDeletePress?.(item.id); }} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const PrimaryishCancel = ({
  tCancel,
  tDelete,
  onCancel,
  onDelete,
}: {
  tCancel: string;
  tDelete: string;
  onCancel: () => void;
  onDelete: () => void;
}) => (
  <div style={{ display: "flex", gap: 8 }}>
    <button type="button" className="btn btn-secondary" onClick={onCancel}>
      {tCancel}
    </button>
    <button type="button" className="btn btn-danger" onClick={onDelete}>
      {tDelete}
    </button>
  </div>
);

export default OrderItem;
