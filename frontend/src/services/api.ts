import axios, { AxiosError } from "axios";

const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const baseURL = process.env.NEXT_PUBLIC_API_URL || (isLocalhost ? "http://localhost:5000" : "https://roomroll-api-backend.fly.dev");
const TOKEN_KEY = "roomroll_token";


export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string } | undefined;
    const message = payload?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

export { TOKEN_KEY };
