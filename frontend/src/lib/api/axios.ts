import { clearToken, getAuthToken } from "./auth";

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3333/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// -- Add a request interceptor --
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // const default_token = `oat_MTI.SXpyeTRzMDFjOEJ4UjhUQS1jeUVQUVhsLXFjNXJ6SmZacjNQYmhrMzI2MDQ1NTI1NzE`;
    // config.headers.Authorization = `Bearer ${default_token}`;
  }
  return config;
});

// --- Add a response interceptor ---
apiClient.interceptors.response.use(
  // Auto-clear token on 401
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      delete apiClient.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  },
);

export function extractApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message;
    console.error("API error", message);
    return message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
