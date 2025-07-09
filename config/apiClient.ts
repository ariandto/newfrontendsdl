// src/api/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://apiv2.iotwidiyasetiya.my.id/api", // sesuaikan dengan backend kamu
  withCredentials: true,

  //https://srviot.ariandto.cloud/api
});

export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export default apiClient;
