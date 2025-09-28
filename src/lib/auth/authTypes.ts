// lib/auth/types.ts
import React from "react";

export type UserRole = "artisan" | "supervisor";

export type User = {
  id: string; 
  name: string;
  email: string;
  role: UserRole;
  hasOnboarded?: boolean;
};

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  remember: boolean;
}
