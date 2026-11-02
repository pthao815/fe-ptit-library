import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserDto,
} from "../types/api";
import { http } from "./http";
import { saveAuthSession, updateStoredUser } from "./session";

export const authService = {
  async login(payload: LoginRequest, remember = true): Promise<TokenResponse> {
    const tokenData = await http.post<TokenResponse>("/api/auth/login", payload, {
      skipAuth: true,
    });
    saveAuthSession(tokenData, remember);
    return tokenData;
  },

  async register(payload: RegisterRequest, remember = true): Promise<TokenResponse> {
    const tokenData = await http.post<TokenResponse>("/api/auth/register", payload, {
      skipAuth: true,
    });
    saveAuthSession(tokenData, remember);
    return tokenData;
  },

  async refreshToken(token: string): Promise<TokenResponse> {
    const tokenData = await http.post<TokenResponse>("/api/auth/refresh", undefined, {
      skipAuth: true,
      // Query parameter token
    });
    saveAuthSession(tokenData, true);
    return tokenData;
  },

  async getCurrentUser(): Promise<UserDto> {
    const user = await http.get<UserDto>("/api/auth/me");
    updateStoredUser(user);
    return user;
  },
};
