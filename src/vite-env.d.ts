/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TARGET?: "local" | "remote";
  readonly VITE_API_LOCAL_URL?: string;
  readonly VITE_API_REMOTE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
