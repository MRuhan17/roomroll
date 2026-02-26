import { api } from "@/services/api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

interface RawUser {
  id: number;
  email: string;
  displayName?: string;
  display_name?: string;
}

interface RawAuthResponse {
  user: RawUser;
  token: string;
}

function normalizeAuthResponse(data: RawAuthResponse): AuthResponse {
  return {
    token: data.token,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName ?? data.user.display_name ?? "",
    },
  };
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<RawAuthResponse>("/api/auth/login", payload);
  return normalizeAuthResponse(data);
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<RawAuthResponse>("/api/auth/register", payload);
  return normalizeAuthResponse(data);
}
