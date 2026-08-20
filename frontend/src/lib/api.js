import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 15000,
});

export const endpoints = {
  health: "/health",
  profile: "/profile",
  experience: "/experience",
  skills: "/skills",
  projects: "/projects",
  project: (id) => `/projects/${id}`,
  resume: "/resume",
  contact: "/contact",
};
