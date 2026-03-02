<template>
  <div class="page">
    <div class="page-inner">
      <div class="card">
        <!-- Logo -->
        <div class="logo-wrap">
          <span class="logo-icon">🍷</span>
        </div>
        <h1 class="title">Bienvenido</h1>
        <p class="subtitle">Inicia sesión para continuar</p>

        <form class="form" @submit.prevent="login">
          <div class="field-wrap">
            <label class="field-label">Correo electrónico</label>
            <div class="input-wrap" :class="{ 'input-error': fieldErrors.email }">
              <span class="input-icon" aria-hidden="true">✉</span>
              <input
                v-model="email"
                type="email"
                class="input"
                placeholder="tu@correo.com"
                autocomplete="email"
                @blur="validateEmail()"
              />
            </div>
            <p v-if="fieldErrors.email" class="field-error-msg">{{ fieldErrors.email }}</p>
          </div>

          <div class="field-wrap">
            <label class="field-label">Contraseña</label>
            <div class="input-wrap" :class="{ 'input-error': fieldErrors.password }">
              <span class="input-icon" aria-hidden="true">🔒</span>
              <input
                v-model="password"
                :type="obscurePassword ? 'password' : 'text'"
                class="input"
                placeholder="Mínimo 6 caracteres"
                autocomplete="current-password"
                @blur="validatePassword()"
              />
              <button
                type="button"
                class="input-suffix"
                :aria-label="obscurePassword ? 'Mostrar contraseña' : 'Ocultar contraseña'"
                @click="obscurePassword = !obscurePassword"
              >
                {{ obscurePassword ? '👁' : '👁‍🗨' }}
              </button>
            </div>
            <p v-if="fieldErrors.password" class="field-error-msg">{{ fieldErrors.password }}</p>
          </div>

          <div class="forgot-row">
            <router-link to="/forgot-password" class="link-forgot">¿Olvidaste tu contraseña?</router-link>
          </div>

          <div v-if="error" class="error-box">
            <span class="error-box-icon" aria-hidden="true">⚠</span>
            <span class="error-box-text">{{ error }}</span>
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <template v-else>
              <span class="btn-icon">→</span>
              <span>Ingresar</span>
            </template>
          </button>
        </form>

        <p class="footer-text">
          ¿No tienes cuenta?
          <router-link to="/register" class="link-register">Regístrate</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { getLoginUrl } from '../config/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const obscurePassword = ref(true)
const fieldErrors = ref<{ email?: string; password?: string }>({})

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

const isFormValid = computed(() => {
  const e = email.value.trim()
  const p = password.value
  return e.length > 0 && EMAIL_REGEX.test(e) && p.length >= 6
})

function validateEmail(): string | null {
  const e = email.value.trim()
  if (!e) {
    fieldErrors.value.email = 'Por favor ingresa tu correo electrónico'
    return null
  }
  if (!EMAIL_REGEX.test(e)) {
    fieldErrors.value.email = 'Por favor ingresa un correo electrónico válido'
    return null
  }
  fieldErrors.value.email = undefined
  return e
}

function validatePassword(): string | null {
  const p = password.value
  if (!p) {
    fieldErrors.value.password = 'Por favor ingresa tu contraseña'
    return null
  }
  if (p.length < 6) {
    fieldErrors.value.password = 'La contraseña debe tener al menos 6 caracteres'
    return null
  }
  fieldErrors.value.password = undefined
  return p
}

function validate(): boolean {
  fieldErrors.value = {}
  const e = validateEmail()
  const p = validatePassword()
  return e !== null && p !== null
}

async function login() {
  if (!validate()) return
  error.value = ''
  loading.value = true
  try {
    const res = await axios.post(
      getLoginUrl(),
      new URLSearchParams({ email: email.value.trim(), password: password.value }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } }
    )
    const data = res.data
    if (res.status === 200 && data.token) {
      authStore.setToken(data.token)
      if (data.user) authStore.setUser(data.user)
      if (data.needs_terms_acceptance || (data.user && (!data.user.age_verified || !data.user.terms_accepted || !data.user.privacy_accepted))) {
        await router.push('/age-verification')
      } else {
        const redirect = (route.query.redirect as string) || '/home'
        await router.push(redirect)
      }
    } else {
      error.value = data.message || 'Correo o contraseña incorrectos'
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'No se pudo conectar con el servidor'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}
.page-inner {
  width: 100%;
  max-width: 450px;
}
.card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 32px 24px;
  text-align: center;
}
.logo-wrap {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  border-radius: 24px;
  background: rgba(138, 43, 226, 0.1);
  box-shadow: 0 8px 24px rgba(138, 43, 226, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-icon {
  font-size: 48px;
}
.title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: #424242;
  letter-spacing: -0.5px;
  font-family: system-ui, -apple-system, sans-serif;
}
.subtitle {
  margin: 0 0 28px;
  font-size: 15px;
  color: #757575;
  font-weight: 400;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 0;
  text-align: left;
}
.field-wrap {
  margin-bottom: 20px;
}
.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: #757575;
  font-weight: 500;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 54px;
  background: #fafafa;
  border: 1.5px solid #eee;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-wrap:focus-within {
  border-color: #8a2be2;
  box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.2);
}
.input-wrap.input-error {
  border-color: #f44336;
}
.input-icon {
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(138, 43, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-size: 15px;
  color: #212121;
  outline: none;
}
.input::placeholder {
  color: #bdbdbd;
}
.input-suffix {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  opacity: 0.8;
}
.field-error-msg {
  margin: 6px 0 0;
  font-size: 13px;
  color: #c62828;
}
.forgot-row {
  text-align: right;
  margin: -8px 0 16px;
}
.link-forgot {
  font-size: 13px;
  font-weight: 500;
  color: #8a2be2;
  text-decoration: none;
}
.link-forgot:hover {
  text-decoration: underline;
}
.error-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 12px;
  text-align: left;
}
.error-box-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.error-box-text {
  font-size: 14px;
  font-weight: 500;
  color: #b71c1c;
  flex: 1;
}
.btn-submit {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #8a2be2 0%, #7b1fa2 100%);
  box-shadow: 0 8px 20px rgba(138, 43, 226, 0.4);
  transition: opacity 0.2s, box-shadow 0.2s;
}
.btn-submit:hover:not(:disabled) {
  box-shadow: 0 10px 24px rgba(138, 43, 226, 0.45);
}
.btn-submit:disabled {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.9;
}
.btn-icon {
  font-size: 20px;
}
.btn-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.footer-text {
  margin: 24px 0 0;
  font-size: 14px;
  color: #757575;
}
.link-register {
  font-weight: 600;
  color: #8a2be2;
  text-decoration: none;
  margin-left: 4px;
}
.link-register:hover {
  text-decoration: underline;
}
</style>
