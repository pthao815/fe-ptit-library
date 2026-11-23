/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TARGET?: "local" | "remote";
  readonly VITE_API_LOCAL_URL?: string;
  readonly VITE_API_REMOTE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_MICROSOFT_CLIENT_ID?: string;
  readonly VITE_MICROSOFT_AUTHORITY?: string;
  readonly VITE_MICROSOFT_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
