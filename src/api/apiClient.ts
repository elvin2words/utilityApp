
// ufms/lib/api/apiClient.ts
import React from "react";
import { Alert, Platform } from "react-native";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";


const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "https://api.utility.com";

const ACCESS = "auth.access";
const REFRESH = "auth.refresh";


// Memory Cache for Tokens
let memoryTokens: { accessToken?: string; refreshToken?: string } = {};

// API Client
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // baseURL: API_BASE_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-App-Version": Constants.expoConfig?.version || "unknown",
    "X-Platform": Platform.OS,
  },
});


// Hydrate tokens on app start
export async function hydrateTokens() {
  memoryTokens.accessToken = (await SecureStore.getItemAsync(ACCESS)) ?? undefined;
  memoryTokens.refreshToken = (await SecureStore.getItemAsync(REFRESH)) ?? undefined;
}

export async function setTokens(accessToken: string, refreshToken?: string) {
  memoryTokens.accessToken = accessToken;
  if (refreshToken) memoryTokens.refreshToken = refreshToken;
  await SecureStore.setItemAsync(ACCESS, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export async function clearTokens() {
  memoryTokens = {};
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

export function getTokens() {
  return memoryTokens;
}

// Custom Error for Expired Session
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired. Please log in again.");
    this.name = "SessionExpiredError";
  }
}

// Request Interceptor
apiClient.interceptors.request.use(async (config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    if (!config.headers) {
      config.headers = {};
    }
    (config.headers as any)['Authorization'] = `Bearer ${accessToken}`;
  }
  if (__DEV__)
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? {});
  return config;
});

// Refresh Handling
let isRefreshing = false;
let queue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  originalConfig: AxiosRequestConfig;
}[] = [];

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      queue.push({ resolve, reject, originalConfig: {} });
    });
  }

  isRefreshing = true;

  try {
    const { refreshToken } = getTokens();
    if (!refreshToken) throw new Error("No refresh token");

    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: next } = res.data;
    await setTokens(accessToken, next);
    queue.forEach((p) => p.resolve(accessToken));
    queue = [];
    return accessToken;
  } catch (error) {
    queue.forEach((p) => p.reject(error));
    queue = [];
    await clearTokens();
    throw new SessionExpiredError();
  } finally {
    isRefreshing = false;
  }
}

// Response Interceptor
interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) console.log("[API RESPONSE]", response.data);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetryAxiosRequestConfig;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    if (__DEV__) console.error("[API ERROR]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Helpers
export async function loginApi(email: string, password: string) {
  const res = await apiClient.post("/auth/login", { email, password });
  const { accessToken, refreshToken, user } = res.data;
  await setTokens(accessToken, refreshToken);
  return { accessToken, refreshToken, user };
}

export async function refreshApi(refreshToken: string) {
  const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  return res.data as { accessToken: string; refreshToken?: string };
}

export async function socialLoginApi(provider: "google" | "apple" | "facebook", token: string) {
  const res = await apiClient.post(`/auth/social/${provider}`, { token });
  const { accessToken, refreshToken, user } = res.data;
  await setTokens(accessToken, refreshToken);
  return { accessToken, refreshToken, user };
}

export async function magicLinkLoginApi(email: string) {
  return apiClient.post("/auth/magic-link", { email });
}

export async function logoutApi() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    await clearTokens();
  }
}

export async function getProfileApi() {
  const res = await apiClient.get("/auth/me");
  return res.data;
}

export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.request<T>({ method, url, data, ...config });
  return response.data;
}

export async function getRequest<T>(url: string) {
  const response = await apiClient.get<T>(url);
  return response.data;
}

export async function postRequest<T>(url: string, data: any) {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function putRequest<T>(url: string, data: any) {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function deleteRequest<T>(url: string) {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export { apiClient };




// import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
// import * as SecureStore from "expo-secure-store";
// import Constants from "expo-constants";
// 

// const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "https://api.example.com";

// const ACCESS = "auth.access";
// const REFRESH = "auth.refresh";

// export async function setTokens(accessToken: string, refreshToken?: string) {
//   await SecureStore.setItemAsync(ACCESS, accessToken);
//   if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
// }

// export async function getTokens() {
//   const accessToken = await SecureStore.getItemAsync(ACCESS);
//   const refreshToken = await SecureStore.getItemAsync(REFRESH);
//   return { accessToken, refreshToken };
// }

// export async function clearTokens() {
//   await SecureStore.deleteItemAsync(ACCESS);
//   await SecureStore.deleteItemAsync(REFRESH);
// }

// const apiClient: AxiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   // baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api",
//   timeout: 15000,
//   headers: { "Content-Type": "application/json" },
// });

// /**
//  * Request Interceptor
//  */
// apiClient.interceptors.request.use(async (config: AxiosRequestConfig) => {
//   const { accessToken } = await getTokens();
//   if (accessToken) {
//     config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
//   }
//   if (__DEV__) console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? {});
//   return config;
// });

// /** Refresh handling (single flight) */
// let isRefreshing = false;
// let queued: ((token: string | null) => void)[] = [];
// let refreshSubscribers: ((token: string) => void)[] = [];

// function flushQueue(token: string | null) {
//   queued.forEach((cb) => cb(token));
//   queued = [];
// }

// function subscribeTokenRefresh(cb: (token: string) => void) {
//   refreshSubscribers.push(cb);
// }

// function onTokenRefreshed(newToken: string) {
//   refreshSubscribers.forEach((cb) => cb(newToken));
//   refreshSubscribers = [];
// }

// async function refreshAccessToken(): Promise<string> {
//   if (isRefreshing) return new Promise<string>((resolve) => subscribeTokenRefresh(resolve));
//   isRefreshing = true;
//   const { refreshToken } = await getTokens();

//   if (!refreshToken) {
//     isRefreshing = false;
//     throw new Error("No refresh token");
//   }

//   try {
//     const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
//     const { accessToken, refreshToken: next } = res.data;
//     await setTokens(accessToken, next);
//     onTokenRefreshed(accessToken);
//     isRefreshing = false;
//     return accessToken;
//   } catch (error) {
//     isRefreshing = false;
//     throw error;
//   } 
// }

// /**
//  * Response Interceptor
//  */
// apiClient.interceptors.response.use(
//   (r: AxiosResponse) => {
//     if (__DEV__) console.log("[API RESPONSE]", r.data);
//     return r;
//   },
//   async (error: AxiosError) => {
//     const original = error.config as AxiosRequestConfig & { _retry?: boolean };
//     // Token expired → try refresh
//     if (error.response?.status === 401 && !original._retry) {
//       original._retry = true;

//       // Queue requests until refresh resolves
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           queued.push((token) => {
//             if (token) {
//               original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
//               resolve(apiClient(original));
//             } else reject(error);
//           });
//         });
//       }

//       isRefreshing = true;
//       try {
//         const newToken = await refreshAccessToken();
//         flushQueue(newToken);
//         isRefreshing = false;
//         original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
//         return apiClient(original);
//       } catch (e) {
//         flushQueue(null);
//         isRefreshing = false;
//         await clearTokens();
//         Alert.alert("Session expired", "Please log in again.");
//       }
//     }

//     if (__DEV__) console.error("[API ERROR]", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );

// /** API endpoint helpers */
// export async function loginApi(email: string, password: string) {
//   const res = await apiClient.post("/auth/login", { email, password });
//   const { accessToken, refreshToken, user } = res.data;
//   await setTokens(accessToken, refreshToken);
//   return res.data as { accessToken: string; refreshToken: string; user: any };
// }

// export async function refreshApi(refreshToken: string) {
//   const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
//   return res.data as { accessToken: string; refreshToken?: string };
// }

// export async function socialLoginApi(provider: "google" | "apple" | "facebook", token: string) {
//   const res = await apiClient.post(`/auth/social/${provider}`, { token });
//   const { accessToken, refreshToken, user } = res.data;
//   await setTokens(accessToken, refreshToken);
//   return res.data as { accessToken: string; refreshToken: string; user: any };
// }

// export async function magicLinkLoginApi(email: string) {
//   return apiClient.post("/auth/magic-link", { email });
// }

// export async function logoutApi() {
//   try { await apiClient.post("/auth/logout"); } finally { await clearTokens(); }
//   await clearTokens();
// }

// export async function getProfileApi() {
//   const res = await apiClient.get("/auth/me");
//   return res.data;
// }

// export async function apiRequest<T = any>(
//   method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
//   url: string,
//   data?: any,
//   config?: AxiosRequestConfig
// ): Promise<T> {
//   const response = await apiClient.request<T>({ method, url, data, ...config });
//   return response.data;
// }

// export async function getRequest<T>(url: string) {
//   const response = await apiClient.get<T>(url);
//   return response.data;
// }

// export async function postRequest<T>(url: string, data: any) {
//   const response = await apiClient.post<T>(url, data);
//   return response.data;
// }

// export async function putRequest<T>(url: string, data: any) {
//   const response = await apiClient.put<T>(url, data);
//   return response.data;
// }

// export async function deleteRequest<T>(url: string) {
//   const response = await apiClient.delete<T>(url);
//   return response.data;
// }

// export { apiClient };


