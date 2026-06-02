import { authUtils } from "@/src/utils/auth";
import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { logout } from "../reducers/authSlice";
import { setRTL } from "../reducers/layoutSlice";
import { ROUTES } from "../../constants";

// Browser: same-origin /api → Next.js route handlers map paths to apiv2 (e.g. /setting → /settings).
// Server/build: NEXT_PUBLIC_API_URL points at the real API host.
const API_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const EXPIRATION_MESSAGES = [
  "Session expired or logged out",
  "Token is invalid or expired",
  "Session expired",
  "Token expired",
  "Please log in again",
];

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = authUtils.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const isSessionExpired = (message: unknown): boolean => {
  const msg = typeof message === "string" ? message : String(message ?? "");
  return EXPIRATION_MESSAGES.some((expMsg) =>
    msg.toLowerCase().includes(expMsg.toLowerCase())
  );
};

const baseQueryWithLogout: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.error.data as any;
    const message = data?.error || data?.message || "";

    if (isSessionExpired(message)) {
      api.dispatch(logout());
      api.dispatch(setRTL(false));

      if (typeof window !== "undefined") {
        window.location.href = ROUTES.Login;
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  tagTypes: [],
  baseQuery: baseQueryWithLogout,
  endpoints: () => ({}),
});
