import { apiClient, extractApiErrorMessage } from "./axios";
import { clearToken, setAuthToken } from "./auth";

type AuthTokenResponse = {
  type?: string;
  token: string;
  expires_at?: string;
  expiresAt?: string;
};

export async function login(email: string, password: string) {
  try {
    const { data } = await apiClient.post<AuthTokenResponse>("/auth/login", {
      email,
      password,
    });

    const token = typeof data?.token === "string" ? data.token : undefined;
    if (token) {
      setAuthToken(token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to login"));
  }
}

export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, "Failed to logout"));
  } finally {
    clearToken();
    delete apiClient.defaults.headers.common.Authorization;
  }
}
