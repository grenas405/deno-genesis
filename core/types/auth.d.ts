// /types/auth.d.ts

export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface AdminUserRecord {
  id: number;
  username: string;
  password_hash: string;
  site_key: string;
}

export interface AuthTokenPayload {
  id: number;
  username: string;
  siteKey: string;
  exp: number;
}