export type UserType = "STUDENT" | "LECTURER" | "RESEARCHER" | "STAFF";
export type Policy = { id: number; userType: UserType; docType: string; loanDays: number; maxLoans: number; maxRenewals: number; holdExpiryDays: number };
export type PenaltyType = { id: number; code: string; name: string; unitName: string; unitPrice: number };
export type SearchConfig = { id: number; chunkSize: number; overlap: number; strategy: string; embeddingModel: string; vectorDimensions: number; isActive: boolean };
export type ConfigurationKind = "policies" | "penalty-types" | "search-configs";
export type DemoMode = "ready" | "empty" | "error";
