import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "roomroll_token";


export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log("Auth token present:", !!token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request failed:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      const msg = error.response.data?.message;
      if (msg === 'MissingTokenError' || msg === 'TokenExpiredError' || msg === 'JsonWebTokenError' || msg === 'Invalid or expired token') {
         // Clear invalid auth state by removing items
         localStorage.removeItem(TOKEN_KEY);
         localStorage.removeItem("roomroll_user");
         // We do not immediately window.location.href = '/login' here to allow 
         // the UI to display the user-friendly error screen.
      }
    }
    return Promise.reject(error);
  }
);

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
