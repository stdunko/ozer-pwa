import axios from "axios";
import { appConfig } from "../config";
import { storage } from "../utils/storage";
import type { UserState } from "../store/userSlice";

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = storage.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authRegister = async (phone: string) => {
  let error;
  let response;
  try {
    response = await api.post("/auth/register", { phone });
  } catch (e) {
    error = e;
    console.error("Invalid phone number:", e);
  }
  return { error, response };
};

export const authLogin = async (phone: string) => {
  let error;
  let response;
  try {
    response = await api.post("/auth/login", { phone });
  } catch (e) {
    error = e;
    console.error("Invalid phone number:", e);
  }
  return { error, response };
};

export const checkOtp = async (otp: string, phone: string) => {
  let error;
  let response;
  try {
    response = await api.post("/auth/verify-otp", { otp, phone });
  } catch (e) {
    console.error("Error checking OTP:", e);
    error = e;
  }
  return { error, response };
};

export const getCurrentUser = async () => {
  let error;
  let response;
  try {
    response = await api.get("/auth/me");
  } catch (e) {
    console.error("Error getting current user:", e);
    error = e;
  }
  return { error, response };
};

export const getCategories = async () => {
  let error;
  let response;
  try {
    response = await api.get("/category");
  } catch (e) {
    error = e;
    console.error("Error getting categories:", e);
  }
  return { error, response };
};

export const updateUserInfo = async (
  id: number,
  user: Omit<UserState, "id" | "createdAt" | "updatedAt" | "phone">
) => {
  let error;
  let response;
  try {
    response = await api.patch(`/user/${id}`, user);
  } catch (e) {
    console.error("Error update current user:", e);
    error = e;
  }
  return { error, response };
};

export const uploadBase64File = async (uploadBase64String: string) => {
  let error;
  let response;
  try {
    response = await api.post("/file/uploadFile", { uploadBase64String });
  } catch (e) {
    console.error("Error uploading file:", e);
    error = e;
  }
  return { error, response };
};

export const addOrder = async (order: {
  userId: number;
  categoryId: number;
  price: number;
  description: string;
  latitude: number;
  longitude: number;
}) => {
  let error;
  let response;
  try {
    response = await api.post("/order", order);
  } catch (e) {
    error = e;
    console.error("Error adding order:", e);
  }
  return { error, response };
};

export const getMyOrders = async () => {
  let error;
  let response;
  try {
    response = await api.get("/order/userOrders", {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      params: { _t: Date.now() },
    });
  } catch (e) {
    error = e;
    console.error("Error getting orders:", e);
  }
  return { error, response };
};

export const deleteOrder = async (orderId: number) => {
  let error;
  let response;
  try {
    response = await api.delete(`/order/${orderId}`);
  } catch (e) {
    error = e;
    console.error("Error deleting order:", e);
  }
  return { error, response };
};
