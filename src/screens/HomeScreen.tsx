import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { getCategories } from "../services/api";
import type { CategoryType } from "../types/category";
import { useNotifier } from "../components/AppNotifier";
import AppHeader from "../components/AppHeader";
import AppTextInput from "../components/AppTextInput";
import CategoryIcon from "../components/CategoryIcon";

const HomeScreen = () => {
  const { t } = useTranslation();
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
      const sorted = [...response.data].sort((a: CategoryType, b: CategoryType) =>
        a.name.localeCompare(b.name)
      );
      setCategories(sorted);
    }
    setInitialLoading(false);
  }, [showApiError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const searched = searchText
    ? categories.filter((c) => c.name.toLowerCase().includes(searchText.toLowerCase()))
    : categories;

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
                  <div className="category-name">{item.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
