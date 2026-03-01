import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setToken, clearToken } from '../services/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<Record<string, unknown> | null>(null)

  function setAuth(t: string, u: Record<string, unknown> | null) {
    token.value = t
    user.value = u
    setToken(t)
  }

  function setUser(u: Record<string, unknown> | null) {
    user.value = u
  }

  function setTokenOnly(t: string) {
    token.value = t
    setToken(t)
  }

  function logout() {
    token.value = null
    user.value = null
    clearToken()
  }

  return { token, user, setAuth, setUser, setToken: setTokenOnly, logout }
})
