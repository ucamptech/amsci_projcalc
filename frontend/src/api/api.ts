import type {
  Activity,
  ActivityResponse,
  Project,
  ProjectDetail,
  ProjectResponse,
  Resource,
  ResourceResponse,
} from "./types";
import axios, { AxiosHeaders } from "axios";
import {
  clearToken,
  getToken,
  restoreTokenFromStorage,
  setToken,
} from "./auth";

import type { ProjectPayload } from "@/data/types";

// --- Base setup ---
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api/v1";

const headers = new AxiosHeaders({
  Authorization: "Bearer",
  "Content-Type": "application/json",
});

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers,
  timeout: 10000,
});

// --- Restore token on startup ---
const restored = restoreTokenFromStorage();
if (restored) {
  apiClient.defaults.headers.common.Authorization = `Bearer ${restored}`;
}

// --- Add a request interceptor ---
apiClient.interceptors.request.use((config) => {
  // Attach Authorization automatically if we have a token
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
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
  }
);

// --- Helper types ---
type Primitive = string | number | boolean | null | undefined;
type Params = Record<string, Primitive | Primitive[]>;

interface HttpOptions<D = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: D;
  params?: Params;
  headers?: Record<string, string>;
}

// --- Generic HTTP wrapper ---
async function http<T, D = unknown>(
  path: string,
  options: HttpOptions<D> = {}
): Promise<T> {
  try {
    const res = await apiClient.request<T>({
      url: path,
      method: options.method ?? "GET",
      data: options.data as D,
      params: options.params,
      headers: options.headers,
    });
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const statusText = err.response?.statusText;
      const data = err.response?.data as unknown;

      let message = err.message;

      if (typeof data === "string") message = data;
      else if (data && typeof data === "object" && "message" in data) {
        const maybe = (data as { message?: unknown }).message;
        if (typeof maybe === "string") message = maybe;
      } else if (statusText) {
        message = statusText;
      } else if (typeof status === "number") {
        message = `HTTP ${status}`;
      }

      throw new Error(message);
    }
    throw err;
  }
}

// --- API calls ---
export const api = {
  /** PUBLIC ROUTES */

  /** AUTH */
  async login(email: string, password: string) {
    const data = await http<{
      token?: { type?: string; value?: string } | string;
      user?: string;
    }>("/auth/login", { method: "POST", data: { email, password } });

    const raw = data?.token;
    const token =
      typeof raw === "string" ? raw : (raw?.value as string | undefined);

    if (token) {
      setToken(token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return data;
  },

  async logout() {
    try {
      await http("/auth/logout", { method: "POST" });
    } finally {
      // Remove on logout
      clearToken();
      delete apiClient.defaults.headers.common.Authorization;
    }
  },

  /** PROTECTED ROUTES */

  /** PROJECTS */
  async getProjects(): Promise<Project[]> {
    const projects = await http<ProjectResponse>("/projects");

    return projects.data;
  },
  async getProjectById(id: string | number): Promise<ProjectDetail> {
    return await http(`/projects/${id}`);
  },
  async createProject(payload: ProjectPayload) {
    return await http("/projects", { method: "POST", data: payload });
  },
  async updateProject(id: string | number, payload: ProjectPayload) {
    return await http(`/projects/${id}`, { method: "PUT", data: payload });
  },

  /** ACTIVITIES */
  async getActivities(): Promise<Activity[]> {
    const activities = await http<ActivityResponse>("/activities");

    return activities.data;
  },

  /** RESOURCES */
  async getResources(
    filter?: "Technical" | "Functional" | string
  ): Promise<Resource[]> {
    const resources = await http<ResourceResponse>("/resources");

    if (!filter) return resources.data;

    const keyword = filter.toLowerCase();
    return resources.data.filter((r) =>
      r.resourceType?.name?.toLowerCase().includes(keyword)
    );
  },
};
