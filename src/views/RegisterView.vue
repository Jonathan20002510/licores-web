<template>
  <div class="page">
    <!-- Header con volver -->
    <header class="header">
      <router-link to="/login" class="btn-back" aria-label="Volver">←</router-link>
      <h1 class="header-title">Crear Cuenta</h1>
    </header>

    <div class="page-inner">
      <div class="card">
        <div class="logo-wrap">
          <span class="logo-icon">🍷</span>
        </div>
        <h2 class="title">Únete a nosotros</h2>
        <p class="subtitle">Crea tu cuenta en pocos pasos</p>

        <form class="form" @submit.prevent="register">
          <div class="field-wrap">
            <label class="field-label">Nombre completo</label>
            <div class="input-wrap" :class="{ 'input-error': fieldErrors.name }">
              <span class="input-icon" aria-hidden="true">👤</span>
              <input
                v-model="name"
                type="text"
                class="input"
                placeholder="Ej: Juan Pérez"
                autocomplete="name"
                @blur="validateName()"
              />
            </div>
            <p v-if="fieldErrors.name" class="field-error-msg">{{ fieldErrors.name }}</p>
          </div>

          <div class="field-wrap">
            <label class="field-label">Correo electrónico</label>
            <div class="input-wrap" :class="{ 'input-error': fieldErrors.email }">
              <span class="input-icon" aria-hidden="true">✉</span>
              <input
                v-model="email"
                type="email"
                class="input"
                placeholder="ejemplo@correo.com"
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
                autocomplete="new-password"
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

          <div class="field-wrap">
            <label class="field-label">Teléfono</label>
            <div class="input-wrap" :class="{ 'input-error': fieldErrors.phone }">
              <span class="input-icon" aria-hidden="true">📱</span>
              <input
                v-model="phone"
                type="tel"
                class="input"
                placeholder="0987654321"
                maxlength="10"
                autocomplete="tel"
                @blur="validatePhone()"
                @input="phone = phone.replace(/\D/g, '').slice(0, 10)"
              />
            </div>
            <p v-if="fieldErrors.phone" class="field-error-msg">{{ fieldErrors.phone }}</p>
          </div>

          <!-- Sección términos (estilo Flutter) -->
          <div class="terms-box">
            <label class="checkbox-row">
              <input v-model="ageVerified" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">
                <strong>Confirmo que soy mayor de 18 años</strong>
                <span class="checkbox-sub">Declaro que tengo la edad legal para comprar productos alcohólicos</span>
              </span>
            </label>
            <label class="checkbox-row">
              <input v-model="termsAccepted" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">
                <strong>Acepto los Términos y Condiciones</strong>
                <span class="checkbox-sub">He leído y acepto los términos y condiciones de uso</span>
              </span>
              <router-link to="/terms" target="_blank" class="btn-ver" @click.stop>Ver</router-link>
            </label>
            <label class="checkbox-row">
              <input v-model="privacyAccepted" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">
                <strong>Acepto la Política de Privacidad</strong>
                <span class="checkbox-sub">He leído y acepto cómo se manejan mis datos personales</span>
              </span>
              <router-link to="/privacy" target="_blank" class="btn-ver" @click.stop>Ver</router-link>
            </label>
          </div>

          <div v-if="error" class="error-box">
            <span class="error-box-icon" aria-hidden="true">⚠</span>
            <span class="error-box-text">{{ error }}</span>
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="loading || !canRegister || !isFormValid"
          >
            <span v-if="loading" class="btn-spinner"></span>
            <template v-else>
              <span class="btn-icon">👤+</span>
              <span>Crear Cuenta</span>
            </template>
          </button>
        </form>

        <p class="footer-text">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="link-login">Inicia sesión</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { getRegisterUrl } from '../config/api'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const ageVerified = ref(false)
const termsAccepted = ref(false)
const privacyAccepted = ref(false)
const error = ref('')
const loading = ref(false)
const obscurePassword = ref(true)
const fieldErrors = ref<{ name?: string; email?: string; phone?: string; password?: string }>({})

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/

const canRegister = computed(() => ageVerified.value && termsAccepted.value && privacyAccepted.value)

const isFormValid = computed(() => {
  const n = name.value.trim()
  const e = email.value.trim()
  const p = password.value
  const ph = phone.value.replace(/\s|-|\(|\)/g, '')
  return (
    n.length >= 2 &&
    n.length <= 50 &&
    NAME_REGEX.test(n) &&
    e.length > 0 &&
    EMAIL_REGEX.test(e) &&
    p.length >= 6 &&
    ph.length === 10 &&
    /^[0-9]+$/.test(ph)
  )
})

function validateName(): string | null {
  const n = name.value.trim()
  if (!n) {
    fieldErrors.value.name = 'Por favor ingresa tu nombre'
    return null
  }
  if (n.length < 2) {
    fieldErrors.value.name = 'El nombre debe tener al menos 2 caracteres'
    return null
  }
  if (n.length > 50) {
    fieldErrors.value.name = 'El nombre no puede exceder 50 caracteres'
    return null
  }
  if (!NAME_REGEX.test(n)) {
    fieldErrors.value.name = 'El nombre solo puede contener letras y espacios'
    return null
  }
  fieldErrors.value.name = undefined
  return n
}

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
    fieldErrors.value.password = 'Por favor ingresa una contraseña'
    return null
  }
  if (p.length < 6) {
    fieldErrors.value.password = 'La contraseña debe tener al menos 6 caracteres'
    return null
  }
  fieldErrors.value.password = undefined
  return p
}

function validatePhone(): string | null {
  const ph = phone.value.replace(/\s|-|\(|\)/g, '')
  if (!ph) {
    fieldErrors.value.phone = 'Por favor ingresa tu número de teléfono'
    return null
  }
  if (ph.length !== 10) {
    fieldErrors.value.phone = 'El teléfono debe tener exactamente 10 dígitos'
    return null
  }
  if (!/^[0-9]+$/.test(ph)) {
    fieldErrors.value.phone = 'El teléfono solo puede contener números'
    return null
  }
  fieldErrors.value.phone = undefined
  return ph
}

function validate(): boolean {
  fieldErrors.value = {}
  const a = validateName()
  const b = validateEmail()
  const c = validatePassword()
  const d = validatePhone()
  if (!ageVerified.value || !termsAccepted.value || !privacyAccepted.value) {
    error.value = 'Debes aceptar todos los términos y confirmar que eres mayor de edad'
    return false
  }
  error.value = ''
  return a !== null && b !== null && c !== null && d !== null
}

async function register() {
  if (!validate()) return
  if (!canRegister.value) {
    error.value = 'Debes aceptar todos los términos para registrarte'
    return
  }
  loading.value = true
  error.value = ''
  const cleanPhone = phone.value.replace(/\s|-|\(|\)/g, '')
  try {
    const res = await axios.post(
      getRegisterUrl(),
      {
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        phone: cleanPhone,
        age_verified: ageVerified.value,
        terms_accepted: termsAccepted.value,
        privacy_accepted: privacyAccepted.value,
      },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    )
    const data = res.data
    if ((res.status === 200 || res.status === 201) && data.token) {
      authStore.setToken(data.token)
      if (data.user) authStore.setUser(data.user)
      if (data.needs_terms_acceptance || (data.user && (!data.user.age_verified || !data.user.terms_accepted || !data.user.privacy_accepted))) {
        await router.push('/age-verification')
      } else {
        await router.push('/home')
      }
    } else {
      error.value = data.message || 'Error al registrarse'
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
  padding-bottom: 32px;
  box-sizing: border-box;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}
.btn-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  text-decoration: none;
  border-radius: 12px;
  font-size: 22px;
  line-height: 1;
}
.header-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}
.page-inner {
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 28px 24px;
  text-align: center;
}
.logo-wrap {
  width: 90px;
  height: 90px;
  margin: 0 auto 20px;
  border-radius: 24px;
  background: rgba(138, 43, 226, 0.1);
  box-shadow: 0 8px 24px rgba(138, 43, 226, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-icon {
  font-size: 44px;
}
.title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: #424242;
  letter-spacing: -0.5px;
  font-family: system-ui, -apple-system, sans-serif;
}
.subtitle {
  margin: 0 0 24px;
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
  margin-bottom: 16px;
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

/* Términos (estilo Flutter) */
.terms-box {
  padding: 20px;
  margin: 24px 0 28px;
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
}
.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  border-radius: 12px;
}
.checkbox-row:first-child {
  padding-top: 0;
}
.checkbox-row + .checkbox-row {
  border-top: 1px solid #eee;
}
.checkbox-input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: #8a2be2;
}
.checkbox-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.checkbox-text strong {
  font-size: 15px;
  font-weight: 600;
  color: #424242;
}
.checkbox-sub {
  font-size: 13px;
  color: #757575;
  line-height: 1.4;
}
.btn-ver {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #8a2be2;
  background: rgba(138, 43, 226, 0.1);
  border-radius: 8px;
  text-decoration: none;
}
.btn-ver:hover {
  background: rgba(138, 43, 226, 0.2);
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
  font-size: 18px;
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
.link-login {
  font-weight: 600;
  color: #8a2be2;
  text-decoration: none;
  margin-left: 4px;
}
.link-login:hover {
  text-decoration: underline;
}
</style>
