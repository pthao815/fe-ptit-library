export type Role = "reader" | "staff" | "admin";

export type NavIcon =
  | "dashboard"
  | "book"
  | "bookmark"
  | "document"
  | "users"
  | "settings"
  | "search"
  | "sparkle";

export type Book = {
  id: number;
  title: string;
  author: string;
  year: string;
  type: string;
  rating: number;
  available: boolean;
  code: string;
  cover: string;
};
