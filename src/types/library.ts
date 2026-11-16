export type Role = "reader" | "staff" | "admin";

export type NavIcon =
  | "dashboard"
  | "circulation"
  | "book"
  | "bookmark"
  | "document"
  | "users"
  | "user"
  | "chart"
  | "shield"
  | "settings"
  | "search"
  | "sparkle";

export type Book = {
  id: number;
  documentId?: string;
  digitalCopyId?: string;
  title: string;
  author: string;
  year: string;
  type: string;
  rating: number;
  available: boolean;
  code: string;
  cover: string;
};
