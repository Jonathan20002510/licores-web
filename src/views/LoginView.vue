<template>
  <div class="page">
    <h1>Iniciar sesión</h1>
    <form @submit.prevent="login" class="form">
      <p v-if="error" class="error">{{ error }}</p>
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Contraseña" />
      <button type="submit" :disabled="loading">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
    </form>
    <p><router-link to="/register">Registrarse</router-link> · <router-link to="/forgot-password">¿Olvidaste tu contraseña?</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/

function validate(): boolean {
  error.value = ''
  const e = email.value.trim()
  if (!e) {
    error.value = 'Por favor ingresa tu correo electrónico'
    return false
  }
  if (!EMAIL_REGEX.test(e)) {
    error.value = 'Por favor ingresa un correo electrónico válido'
    return false
  }
  if (!password.value) {
    error.value = 'Por favor ingresa tu contraseña'
    return false
  }
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  return true
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
    error.value = err.response?.data?.message || 'Correo o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { max-width: 400px; margin: 2rem auto; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
.form input { width: 100%; }
</style>
