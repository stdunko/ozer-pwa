import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Camera, Mail, Phone, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setToken } from "../store/authSlice";
import { setUser, setUserPhoto } from "../store/userSlice";
import { resetLive } from "../store/liveSlice";
import { updateUserInfo, uploadBase64File } from "../services/api";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { storage } from "../utils/storage";
import { compressImageFile } from "../utils/image";
import { getInitials } from "../utils/chat";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [email, setEmail] = useState(user.email || "");
  const [name, setName] = useState(user.name || "");
  const [photo, setPhoto] = useState(user.photo || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setName(user?.name ?? "");
    setPhoto(user?.photo ?? "");
    if (user.phone) {
      setUserLoading(false);
    }
  }, [user]);

  const onPressSave = async () => {
    setSaveLoading(true);
    let { response, error } = await updateUserInfo(user.id, {
      name,
      email,
      ...(photo ? { photo } : {}),
    });
    if (error && photo) {
      ({ response, error } = await updateUserInfo(user.id, { name, email }));
    }
    if (error) {
      showApiError(error, "errorSaveProfile");
    } else if (response?.data) {
      dispatch(setUser({ ...response.data, photo: response.data.photo ?? photo ?? null }));
      showSuccess("successProfileSaved");
    }
    setSaveLoading(false);
  };

  const onPickPhoto = async (file: File | undefined) => {
    if (!file?.type.startsWith("image/")) {
      return;
    }
    setPhotoLoading(true);
    try {
      const dataUrl = await compressImageFile(file, 512, 0.72);
      const { response, error } = await uploadBase64File(dataUrl);
      if (error || !response?.data) {
        showApiError(error, "errorUploadPhoto");
        return;
      }
      const photoUrl = typeof response.data === "string" ? response.data : String(response.data);
      try {
        await setDoc(doc(db, "userProfiles", String(user.id)), { photo: photoUrl }, { merge: true });
      } catch (firestoreError) {
        console.error("Firestore photo:", firestoreError);
      }
      storage.set(`userPhoto:${user.id}`, photoUrl);
      await updateUserInfo(user.id, {
        name: user.name,
        email: user.email,
        photo: photoUrl,
      });
      setPhoto(photoUrl);
      dispatch(setUserPhoto(photoUrl));
      showSuccess("photoUpdated");
    } finally {
      setPhotoLoading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const logOut = () => {
    storage.remove("token");
    dispatch(setToken(""));
    dispatch(resetLive());
    dispatch(setUser({ id: 0, name: "", email: "", phone: "", photo: null, status: 0 }));
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
            <div className="profile-hero">
              <button
                type="button"
                className="profile-avatar"
                onClick={() => fileRef.current?.click()}
                disabled={photoLoading}
                aria-label={photo ? t("changePhoto") : t("addPhoto")}
              >
                {photo ? (
                  <img src={photo} alt="" />
                ) : (
                  <span className="profile-avatar-fallback">{getInitials(name || user.phone)}</span>
                )}
                <span className="profile-avatar-cam">
                  {photoLoading ? <span className="spinner" /> : <Camera size={16} />}
                </span>
              </button>
              <div className="profile-hero-name">{name || user.phone}</div>
              <button type="button" className="profile-photo-link" onClick={() => fileRef.current?.click()}>
                {photo ? t("changePhoto") : t("addPhoto")}
              </button>
              <input
                ref={fileRef}
                className="hidden-file"
                type="file"
                accept="image/*"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </div>
            <div className="profile-card">
              <AppTextInput icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} />
              <AppTextInput icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} />
              <AppTextInput icon={Phone} value={user.phone} readOnly placeholder={t("phone")} />
            </div>
          </>
        )}
        <div className="profile-actions">
          <PrimaryButton
            title={t("confirm")}
            onPress={onPressSave}
            loading={saveLoading}
            disabled={saveLoading || !isFormChanged || name === ""}
          />
          <PrimaryButton title={t("aboutTitle")} variant="secondary" onPress={() => navigate("/app/about")} />
          <PrimaryButton title={t("logOut")} variant="secondary" onPress={logOut} className="btn-logout" />
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
