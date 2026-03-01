<template>
  <div class="page">
    <h1>Registrarse</h1>
    <form @submit.prevent="register" class="form">
      <p v-if="error" class="error">{{ error }}</p>
      <input v-model="name" type="text" placeholder="Nombre (mín. 2 caracteres)" />
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="phone" type="tel" placeholder="Teléfono (10 dígitos)" maxlength="10" />
      <input v-model="password" type="password" placeholder="Contraseña (mín. 6)" />
      <label class="checkbox">
        <input v-model="ageVerified" type="checkbox" />
        Confirmo que soy mayor de 18 años
      </label>
      <label class="checkbox">
        <input v-model="termsAccepted" type="checkbox" />
        Acepto los <router-link to="/terms" target="_blank">términos y condiciones</router-link>
      </label>
      <label class="checkbox">
        <input v-model="privacyAccepted" type="checkbox" />
        Acepto la <router-link to="/privacy" target="_blank">política de privacidad</router-link>
      </label>
      <button type="submit" :disabled="loading">{{ loading ? 'Registrando...' : 'Registrarse' }}</button>
    </form>
    <p><router-link to="/login">Ya tengo cuenta</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

function validate(): boolean {
  error.value = ''
  const n = name.value.trim()
  if (!n || n.length < 2) {
    error.value = 'El nombre debe tener al menos 2 caracteres'
    return false
  }
  if (n.length > 50) {
    error.value = 'El nombre no puede exceder 50 caracteres'
    return false
  }
  const e = email.value.trim()
  if (!e) {
    error.value = 'Por favor ingresa tu correo electrónico'
    return false
  }
  if (!EMAIL_REGEX.test(e)) {
    error.value = 'Por favor ingresa un correo electrónico válido'
    return false
  }
  const cleanPhone = phone.value.replace(/\s|-|\(|\)/g, '')
  if (cleanPhone.length !== 10) {
    error.value = 'El teléfono debe tener exactamente 10 dígitos'
    return false
  }
  if (!/^[0-9]+$/.test(cleanPhone)) {
    error.value = 'El teléfono solo puede contener números'
    return false
  }
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  if (!ageVerified.value || !termsAccepted.value || !privacyAccepted.value) {
    error.value = 'Debes aceptar los términos y confirmar que eres mayor de edad'
    return false
  }
  return true
}

async function register() {
  if (!validate()) return
  loading.value = true
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
    error.value = err.response?.data?.message || 'Error de conexión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { max-width: 440px; margin: 2rem auto; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
.form input[type="text"],
.form input[type="email"],
.form input[type="tel"],
.form input[type="password"] { width: 100%; }
.checkbox { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.95em; }
.checkbox a { white-space: nowrap; }
</style>
