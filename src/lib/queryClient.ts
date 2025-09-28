// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/src/lib/constants";

// Create a global query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // retry once on failure
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

// Typed API request helper
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest<T = any>(
  method: HttpMethod,
  endpoint: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "API request failed");
  }

  return res.json() as Promise<T>;
}
