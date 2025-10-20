import type { Activity, ProjectCreatePayload, Resource } from "@/data/types";

// src/lib/api.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Helper types
type Primitive = string | number | boolean | null | undefined;
type Params = Record<string, Primitive | Primitive[]>;

interface HttpOptions<D = unknown> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: D;
  params?: Params;
  headers?: Record<string, string>;
}

// Generic HTTP helper (no `any`)
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
      // Try common error message shapes without using `any`
      const statusText = err.response?.statusText;
      const status = err.response?.status;
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

// API surface
export const api = {
  getActivities(): Promise<Activity[]> {
    return http<Activity[]>("/activities");
  },
  getResources(): Promise<Resource[]> {
    return http<Resource[]>("/resources");
  },
  createProject(payload: ProjectCreatePayload) {
    return http<unknown, ProjectCreatePayload>("/projects", {
      method: "POST",
      data: payload,
    });
  },
};
