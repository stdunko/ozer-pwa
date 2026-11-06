import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryType } from "../types/category";
import { useCategoryLabel } from "../utils/categoryI18n";
import AppTextInput from "./AppTextInput";
import CategoryIcon from "./CategoryIcon";

type CategoryPickerProps = {
  isVisible: boolean;
  categories: CategoryType[];
  selectedId?: number | null;
  onSelect: (category: CategoryType) => void;
  onClose: () => void;
};

const CategoryPicker = ({ isVisible, categories, selectedId, onSelect, onClose }: CategoryPickerProps) => {
  const { t } = useTranslation();
  const cat = useCategoryLabel();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isVisible) {
      setSearch("");
    }
  }, [isVisible]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return categories;
    }
    return categories.filter((item) => {
      const label = cat(item).toLowerCase();
      return label.includes(query) || item.name.toLowerCase().includes(query);
    });
  }, [cat, categories, search]);

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <div className="sheet-header">
          <h2 className="sheet-title">{t("selectCategory")}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("close")}>
            <X size={22} />
          </button>
        </div>
        <div className="sheet-search">
          <AppTextInput
            icon={Search}
            placeholder={t("categories")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sheet-body">
          {filtered.length === 0 ? (
            <p className="empty">{search.trim() ? t("categoriesNotFound") : t("errorLoadCategories")}</p>
          ) : (
            <div className="picker-list">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`picker-row ${selectedId === item.id ? "selected" : ""}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <span className="picker-row-icon">
                    <CategoryIcon iconUrl={item.icon} categoryName={item.name} />
                  </span>
                  <span className="picker-row-name">{cat(item)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategoryPicker;
