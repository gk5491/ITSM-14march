import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const normalizedBaseUrl = API_BASE_URL.replace(/\/$/, "");
const usesPhpBackend =
  /\/php$/i.test(normalizedBaseUrl) ||
  /cybaemtech\.(in|net|com)(\/itsm_app)?$/i.test(normalizedBaseUrl);

function appendQuery(url: string, query: string) {
  return url.includes("?") ? `${url}&${query}` : `${url}?${query}`;
}

function toPhpEndpoint(endpoint = "") {
  if (!usesPhpBackend || !endpoint.startsWith("/api/")) {
    return endpoint;
  }

  const [path, query = ""] = endpoint.slice(1).split("?");
  const withQuery = (mapped: string) => (query ? `${mapped}?${query}` : mapped);

  const phpBase = /\/php$/i.test(normalizedBaseUrl) ? "/api" : "/php/api";

  const authMap: Record<string, string> = {
    "api/login": `${phpBase}/auth.php?action=login`,
    "api/register": `${phpBase}/auth.php?action=register`,
    "api/logout": `${phpBase}/auth.php?action=logout`,
    "api/user": `${phpBase}/auth.php`,
    "api/forgot-password": `${phpBase}/auth.php?action=forgot-password`,
    "api/reset-password": `${phpBase}/auth.php?action=reset-password`,
  };

  if (authMap[path]) return withQuery(authMap[path]);
  if (path === "api/tickets/my") return withQuery(`${phpBase}/tickets.php?user=my`);
  if (path === "api/tickets/assigned") return withQuery(`${phpBase}/tickets.php?user=my`);

  const ticketCommentMatch = path.match(/^api\/tickets\/(\d+)\/comments$/);
  if (ticketCommentMatch) {
    return withQuery(`${phpBase}/tickets.php?action=comment&id=${ticketCommentMatch[1]}`);
  }

  const entityMatch = path.match(/^api\/(tickets|users|categories|faqs|domains)\/(\d+)(?:\/password)?$/);
  if (entityMatch) {
    const mapped = `${phpBase}/${entityMatch[1]}.php?id=${entityMatch[2]}`;
    return query ? appendQuery(mapped, query) : mapped;
  }

  if (path === "api/reports/agent-performance") {
    return withQuery(`${phpBase}/reports.php?type=performance`);
  }

  if (path === "api/project-bug-reports" || path === "api/bug-reports") {
    return withQuery(`${phpBase}/project-bug-reports.php`);
  }

  const siteEnggMatch = path.match(/^api\/site-engg\/(.+)$/);
  if (siteEnggMatch) {
    const mapped = `${phpBase}/site-engg-router.php?route=${encodeURIComponent(siteEnggMatch[1])}`;
    return query ? appendQuery(mapped, query) : mapped;
  }

  const simpleMatch = path.match(/^api\/([^/]+)$/);
  if (simpleMatch) {
    return withQuery(`${phpBase}/${simpleMatch[1]}.php`);
  }

  return endpoint;
}

const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let sessionCookie: string | null = null;

export const setSessionCookie = (cookie: string | null) => {
  sessionCookie = cookie;
};

export const getSessionCookie = () => sessionCookie;

apiClient.interceptors.request.use(async (config) => {
  config.url = toPhpEndpoint(config.url);
  if (!sessionCookie) {
    sessionCookie = await AsyncStorage.getItem("session_cookie");
  }
  if (sessionCookie) {
    config.headers["Cookie"] = sessionCookie;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      const sessionPart = cookie.split(";")[0];
      sessionCookie = sessionPart;
      AsyncStorage.setItem("session_cookie", sessionPart);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem("session_cookie");
      sessionCookie = null;
    }
    if (error.response?.data?.error && !error.response.data.message) {
      error.response.data.message = error.response.data.error;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
