import axios, { AxiosInstance } from "axios";
import APP_ROUTE from "@/lib/app-route.ts";
import { isCloud, getBackendUrl } from "@/lib/config.ts";
import { logAxiosError, logWarn } from "@/lib/logger";

const api: AxiosInstance = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    // we need the response headers for these endpoints
    const exemptEndpoints = ["/api/pages/export", "/api/spaces/export"];
    if (response.request.responseURL) {
      const path = new URL(response.request.responseURL)?.pathname;
      if (path && exemptEndpoints.includes(path)) {
        return response;
      }
    }

    return response.data;
  },
  async (error) => {
    if (error.response) {
      // 记录错误响应细节
      await logAxiosError(error);
      switch (error.response.status) {
        case 401: {
          const url = new URL(error.request.responseURL)?.pathname;
          if (url === "/api/auth/collab-token") return Promise.reject(error);
          if (window.location.pathname.startsWith("/share/")) return Promise.reject(error);

          // Handle unauthorized error
          await logWarn("axios.401.redirectToLogin", { path: url });
          redirectToLogin();
          break;
        }
        case 403:
          // Handle forbidden error
          await logWarn("axios.403", { url: error.request?.responseURL });
          break;
        case 404:
          // Handle not found error
          if (
            error.response.data.message
              .toLowerCase()
              .includes("workspace not found")
          ) {
            console.log("workspace not found");
            if (
              !isCloud() &&
              window.location.pathname != APP_ROUTE.AUTH.SETUP
            ) {
              await logWarn("axios.404.workspaceNotFound.redirectToSetup");
              window.location.href = APP_ROUTE.AUTH.SETUP;
            }
          }
          break;
        case 500:
          // Handle internal server error
          await logWarn("axios.500", { url: error.request?.responseURL });
          break;
        default:
          await logWarn("axios.unhandled", { status: error.response.status });
          break;
      }
    }
    return Promise.reject(error);
  },
);

function redirectToLogin() {
  const exemptPaths = [
    APP_ROUTE.AUTH.LOGIN,
    APP_ROUTE.AUTH.SIGNUP,
    APP_ROUTE.AUTH.FORGOT_PASSWORD,
    APP_ROUTE.AUTH.PASSWORD_RESET,
    "/invites",
  ];
  if (!exemptPaths.some((path) => window.location.pathname.startsWith(path))) {
    window.location.href = APP_ROUTE.AUTH.LOGIN;
  }
}

export default api;
