// Compatibility boundary for Module 1. New code imports shared/auth/auth-session.
export {
  authSession as module2Session,
  sessionFromAccessToken,
} from "../shared/auth/auth-session.ts"
export type {
  AuthRole as Module2Role,
  AuthSession as Module2Session,
} from "../shared/auth/auth-session.ts"
