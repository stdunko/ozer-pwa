import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, FileText, LayoutGrid, Wallet } from "lucide-react";
import { addOrder, getCategories } from "../services/api";
import { useAppSelector } from "../store/hooks";
import { useNotifier } from "../components/AppNotifier";
import { appConfig } from "../config";
import type { CategoryType } from "../types/category";
import AppHeader from "../components/AppHeader";
import AppTextInput from "../components/AppTextInput";
import CategoryPicker from "../components/CategoryPicker";
import PrimaryButton from "../components/PrimaryButton";
import NameModal from "../components/NameModal";
import MapView from "../components/MapView";

const hasValidCoords = (lat: number | null, lng: number | null) =>
  lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

const CreateOrderScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const initialCategory = (location.state as { category?: CategoryType } | null)?.category ?? null;
  const { showApiError, showSuccess, showInfo } = useNotifier();
  const user = useAppSelector((state) => state.user);
  const [category, setCategory] = useState<CategoryType | null>(initialCategory);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      const { response, error } = await getCategories();
      if (error) {
        showApiError(error, "errorLoadCategories");
        return;
      }
      if (response?.data) {
        const sorted = [...response.data].sort((a: CategoryType, b: CategoryType) =>
          a.name.localeCompare(b.name)
        );
        setCategories(sorted);
      }
    })();
  }, [showApiError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLatitude(appConfig.defaultCoords.latitude);
      setLongitude(appConfig.defaultCoords.longitude);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => {
        setLatitude(appConfig.defaultCoords.latitude);
        setLongitude(appConfig.defaultCoords.longitude);
        showInfo("locationDenied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [showInfo]);

  const submitOrder = async () => {
    if (!category || !hasValidCoords(latitude, longitude)) {
      showApiError(new Error("invalid order"), "errorCreateOrder");
      return;
    }
    setIsLoading(true);
    const { error } = await addOrder({
      userId: user.id,
      categoryId: category.id,
      price: price!,
      description,
      latitude: latitude!,
      longitude: longitude!,
    });
    setIsLoading(false);
    if (error) {
      showApiError(error, "errorCreateOrder");
      return;
    }
    showSuccess("successOrderCreated");
    navigate("/app/orders", { replace: false });
  };

  const onPress = async () => {
    if (!user.name || !user.email) {
      setNameModalVisible(true);
      return;
    }
    await submitOrder();
  };

  return (
    <div className="screen">
      <AppHeader title={category?.name || t("createOrder")} back />
      <div className="scroll">
        <div className="map-wrap">
          {latitude != null && longitude != null ? (
            <MapView
              latitude={latitude}
              longitude={longitude}
              onRegionChange={(region) => {
                setLatitude(region.latitude);
                setLongitude(region.longitude);
              }}
            />
          ) : (
            <div className="loader">
              <span className="spinner" />
            </div>
          )}
          <img className="fake-marker" src="/maps-and-flags.png" alt="" />
        </div>
        <div className="pad">
          <button
            type="button"
            className={`field-btn ${category ? "" : "placeholder"}`}
            onClick={() => setPickerOpen(true)}
          >
            <span className="field-icon">
              <LayoutGrid size={20} />
            </span>
            <span>{category?.name || t("selectCategory")}</span>
            <ChevronDown size={18} />
          </button>
          <AppTextInput
            icon={Wallet}
            placeholder={t("price")}
            value={price !== null ? String(price) : ""}
            inputMode="numeric"
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^0-9]/g, "");
              setPrice(numericValue ? parseInt(numericValue, 10) : null);
            }}
          />
          <AppTextInput
            icon={FileText}
            placeholder={t("description")}
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <PrimaryButton
            title={t("createOrder")}
            onPress={onPress}
            loading={isLoading}
            disabled={!category || !price || !description || !hasValidCoords(latitude, longitude)}
          />
        </div>
      </div>
      <CategoryPicker
        isVisible={pickerOpen}
        categories={categories}
        selectedId={category?.id}
        onSelect={setCategory}
        onClose={() => setPickerOpen(false)}
      />
      <NameModal
        isVisible={nameModalVisible}
        onClose={() => setNameModalVisible(false)}
        onSaved={() => {
          setNameModalVisible(false);
          void submitOrder();
        }}
      />
    </div>
  );
};

export default CreateOrderScreen;
