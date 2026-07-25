import { useAuthStore } from "@/app/store/use-auth.store";
import { isAuthLogoutLocked } from "@/app/utils/auth-cache.util";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { AuthResponse } from "@/app/interfaces/user.interface";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type QueueItem = {
  resolve: (session: RefreshResponse) => void;
  reject: (error: unknown) => void;
};

export type RefreshResponse = AuthResponse;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
};

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isAuthLogoutLocked()) {
    useAuthStore.getState().clearAuth();
    delete config.headers.Authorization;
    return config;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (
  error: unknown,
  session: RefreshResponse | null = null,
) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !session) reject(error);
    else resolve(session);
  });
  failedQueue = [];
};

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

export const refreshAuthSession = async (): Promise<RefreshResponse> => {
  if (isAuthLogoutLocked()) {
    useAuthStore.getState().clearAuth();
    throw new Error("Auth refresh skipped during logout.");
  }

  if (isRefreshing) {
    return new Promise<RefreshResponse>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const res =
      await refreshClient.post<ApiEnvelope<RefreshResponse>>("/auth/refresh");
    const session = unwrapApiData(res.data);

    if (isAuthLogoutLocked()) {
      throw new Error("Auth refresh skipped during logout.");
    }

    useAuthStore
      .getState()
      .setAuth(
        session.accessToken,
        session.user.username,
        session.user.email ?? "",
      );
    processQueue(null, session);

    return session;
  } catch (refreshError) {
    processQueue(refreshError, null);
    useAuthStore.getState().clearAuth();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";
    const shouldSkipRefresh =
      isAuthLogoutLocked() ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password");

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      shouldSkipRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const session = await refreshAuthSession();
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return axiosInstance(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const payload = await axiosInstance.get<unknown, ApiEnvelope<T> | T>(
      url,
      config,
    );
    return unwrapApiData(payload);
  },

  getPaginated: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<{ data: T; meta: PaginationMeta }> => {
    const payload = await axiosInstance.get<unknown, ApiEnvelope<T>>(
      url,
      config,
    );

    return {
      data: payload.data,
      meta: payload.meta || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  },

  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> => {
    const payload = await axiosInstance.post<unknown, ApiEnvelope<T> | T, D>(
      url,
      data,
      config,
    );
    return unwrapApiData(payload);
  },

  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> => {
    const payload = await axiosInstance.put<unknown, ApiEnvelope<T> | T, D>(
      url,
      data,
      config,
    );
    return unwrapApiData(payload);
  },

  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>,
  ): Promise<T> => {
    const payload = await axiosInstance.patch<unknown, ApiEnvelope<T> | T, D>(
      url,
      data,
      config,
    );
    return unwrapApiData(payload);
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const payload = await axiosInstance.delete<unknown, ApiEnvelope<T> | T>(
      url,
      config,
    );
    return unwrapApiData(payload);
  },
};

export { axiosInstance };
