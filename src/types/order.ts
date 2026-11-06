import type { CategoryType } from "./category";

export type OrderStatus = "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELED";

export type Order = {
  id: number;
  status: OrderStatus;
  price: number;
  description: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  created_at?: string;
  executor?: { id: number; name?: string; phone?: string; photo?: string | null };
  executorId?: number | null;
  category: Pick<CategoryType, "id" | "name">;
};

export type PriceSort = "default" | "asc" | "desc";

export type OrderFiltersState = {
  status: OrderStatus | "ALL";
  categoryId: number | "ALL";
  priceMin: string;
  priceMax: string;
  priceSort: PriceSort;
};

export const defaultOrderFilters: OrderFiltersState = {
  status: "ALL",
  categoryId: "ALL",
  priceMin: "",
  priceMax: "",
  priceSort: "default",
};
