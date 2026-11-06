import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { getCategories } from "../services/api";
import type { CategoryType } from "../types/category";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import AppTextInput from "../components/AppTextInput";
import CategoryIcon from "../components/CategoryIcon";
import { useCategoryLabel } from "../utils/categoryI18n";

const HomeScreen = () => {
  const { t, i18n } = useTranslation();
  const cat = useCategoryLabel();
  const navigate = useNavigate();
  const { showApiError } = useNotifier();
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    const { response, error } = await getCategories();
    if (error) {
      showApiError(error, "errorLoadCategories");
    } else if (response?.data) {
      setCategories(response.data);
    }
    setInitialLoading(false);
  }, [showApiError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const searched = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const list = query
      ? categories.filter((item) => {
          const label = cat(item).toLowerCase();
          return label.includes(query) || item.name.toLowerCase().includes(query);
        })
      : categories;
    return [...list].sort((a, b) => cat(a).localeCompare(cat(b), i18n.language));
  }, [cat, categories, i18n.language, searchText]);

  return (
    <div className="screen">
      <AppHeader title={t("categories")} />
      {initialLoading && categories.length === 0 ? (
        <div className="loader">
          <span className="spinner" />
        </div>
      ) : (
        <div className="scroll">
          <div className="search-wrap">
            <AppTextInput
              icon={Search}
              placeholder={t("categories")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {searched.length === 0 ? (
            <p className="empty">{searchText.trim() ? t("categoriesNotFound") : t("errorLoadCategories")}</p>
          ) : (
            <div className="grid">
              {searched.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="category-card"
                  onClick={() => navigate("/app/create-order", { state: { category: item } })}
                >
                  <div className="category-icon">
                    <CategoryIcon iconUrl={item.icon} categoryName={item.name} />
                  </div>
                  <div className="category-count">
                    {item.executorCount} {t("specialists")}
                  </div>
                  <div className="category-name">{cat(item)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="place-order-bar">
        <button type="button" className="btn btn-primary" onClick={() => navigate("/app/create-order")}>
          <Plus size={20} />
          {t("placeOrder")}
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
