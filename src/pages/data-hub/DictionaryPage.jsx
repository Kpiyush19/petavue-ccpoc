import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { DictionaryProvider, Dictionary } from "../../components/data-hub/dictionary";
import { getAuthToken, getCurrentUser } from "../../api";
import { PETAVUE_API_URL } from "../../config";

const createAxiosInstance = (baseURL) => {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message =
        error.response?.data?.message || error.response?.data?.error || error.message || "An error occurred";
      toast.error(message);
      return Promise.reject(error);
    }
  );

  return instance;
};

const notifications = {
  addNotification: ({ type, title, message }) => {
    const toastMessage = message ? `${title}: ${message}` : title;
    if (type === "error") toast.error(toastMessage);
    else if (type === "success") toast.success(toastMessage);
    else toast(toastMessage);
  }
};

export default function DictionaryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const user = currentUser || { role: "user", name: "User" };

  const axiosInstance = useMemo(() => {
    return createAxiosInstance(PETAVUE_API_URL);
  }, []);

  return (
    <div className="h-full overflow-hidden">
      <DictionaryProvider
        axios={axiosInstance}
        queryClient={queryClient}
        notifications={notifications}
        user={user}
        navigate={navigate}
        basePath="/data-hub/dictionary"
      >
        <Dictionary />
      </DictionaryProvider>
    </div>
  );
}
