import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setUser } from "../store/userSlice";
import { updateUserInfo } from "../services/api";
import { useNotifier } from "./AppNotifier";
import AppTextInput from "./AppTextInput";
import PrimaryButton from "./PrimaryButton";

const NameModal = ({
  isVisible,
  onClose,
  onSaved,
}: {
  isVisible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { showApiError } = useNotifier();
  const user = useAppSelector((state) => state.user);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setName(user.name || "");
      setEmail(user.email || "");
      setEmailError(false);
    }
  }, [isVisible, user.email, user.name]);

  if (!isVisible) {
    return null;
  }

  const save = async () => {
    const nextEmail = email.trim();
    if (!name.trim() || !nextEmail.includes("@")) {
      setEmailError(!nextEmail.includes("@"));
      return;
    }
    setSaving(true);
    const { response, error } = await updateUserInfo(user.id, { name: name.trim(), email: nextEmail });
    if (error) {
      showApiError(error, "errorSaveProfile");
      setSaving(false);
      return;
    }
    dispatch(setUser({ ...user, ...(response?.data || {}), name: name.trim(), email: nextEmail }));
    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="sheet-title">{t("nameModalText")}</h3>
        <div style={{ marginTop: 16 }}>
          <AppTextInput icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} />
          <AppTextInput
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(false);
            }}
            placeholder={t("email")}
            error={emailError}
          />
          {emailError ? <p className="error-text">{t("emailInvalid")}</p> : null}
          <PrimaryButton title={t("confirm")} onPress={save} loading={saving} disabled={saving || !name.trim()} />
          <div style={{ height: 8 }} />
          <PrimaryButton title={t("cancel")} variant="secondary" onPress={onClose} />
        </div>
      </div>
    </div>
  );
};

export default NameModal;
