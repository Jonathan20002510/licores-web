import axios from 'axios'
import { apiConfig } from '../config/api'

const TOKEN_KEY = 'token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn
}

export const http = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.requestTimeout,
  headers: {
    Accept: 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 302) {
      clearToken()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        if (onUnauthorized) onUnauthorized()
        else window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
