import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

// ─── Base URL ────────────────────────────────────────────────────────────────

const baseUrl = process.env.NEXT_PUBLIC_API_URL!;

if (!baseUrl) {
  throw new Error("API URL environment variable is not defined");
}

// ─── Instances ───────────────────────────────────────────────────────────────

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  withCredentials: true,
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  withCredentials: true,
});

// ─── Token State ─────────────────────────────────────────────────────────────

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ─────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url ?? "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await refreshClient.post<{ accessToken: string }>(
        "/auth/refresh",
      );

      const { accessToken: newToken } = response.data;
      accessToken = newToken;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      accessToken = null;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;
