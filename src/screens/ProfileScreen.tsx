import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setToken } from "../store/authSlice";
import { setUser } from "../store/userSlice";
import { updateUserInfo } from "../services/api";
import { storage } from "../utils/storage";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import AppTextInput from "../components/AppTextInput";
import PrimaryButton from "../components/PrimaryButton";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showApiError, showSuccess } = useNotifier();
  const user = useAppSelector((state) => state.user);
  const [userLoading, setUserLoading] = useState(true);
  const [email, setEmail] = useState(user.email || "");
  const [name, setName] = useState(user.name || "");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setName(user?.name ?? "");
    if (user.phone) {
      setUserLoading(false);
    }
  }, [user]);

  const onPressSave = async () => {
    setSaveLoading(true);
    const { response, error } = await updateUserInfo(user.id, { name, email });
    if (error) {
      showApiError(error, "errorSaveProfile");
    } else if (response?.data) {
      dispatch(setUser(response.data));
      showSuccess("successProfileSaved");
    }
    setSaveLoading(false);
  };

  const logOut = () => {
    storage.remove("token");
    dispatch(setToken(""));
    dispatch(setUser({ id: 0, name: "", email: "", phone: "", status: 0 }));
  };

  const isFormChanged = name !== (user.name ?? "") || email !== (user.email ?? "");

  return (
    <div className="screen">
      <AppHeader title={t("profile")} />
      <div className="scroll pad">
        {userLoading ? (
          <div className="loader">
            <span className="spinner" />
          </div>
        ) : (
          <>
            <AppTextInput icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} />
            <AppTextInput icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} />
            <AppTextInput icon={Phone} value={user.phone} readOnly placeholder={t("phone")} />
          </>
        )}
        <div style={{ marginTop: 24 }}>
          <PrimaryButton
            title={t("confirm")}
            onPress={onPressSave}
            loading={saveLoading}
            disabled={saveLoading || !isFormChanged || name === ""}
          />
          <div style={{ height: 8 }} />
          <PrimaryButton title={t("logOut")} variant="secondary" onPress={logOut} />
          <div style={{ height: 8 }} />
          <PrimaryButton title={t("aboutTitle")} variant="secondary" onPress={() => navigate("/app/about")} />
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
