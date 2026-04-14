import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
    return Promise.reject(error);
  }
);

export default apiClient;
