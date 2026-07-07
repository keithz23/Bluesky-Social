import { useAuthStore } from "@/app/store/use-auth.store";
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

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
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

export { axiosInstance };
