<template>
  <div class="page">
    <h1>Recuperar contraseña</h1>
    <form @submit.prevent="submit" class="form">
      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Enviando...' : 'Enviar enlace' }}</button>
    </form>
    <p><router-link to="/login">Volver a iniciar sesión</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { getForgotPasswordUrl } from '../config/api'

const email = ref('')
const error = ref('')
const message = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    const res = await axios.post(getForgotPasswordUrl(), { email: email.value.trim() }, { headers: { Accept: 'application/json' } })
    if (res.status === 200) {
      message.value = 'Revisa tu correo para restablecer la contraseña.'
    } else {
      error.value = res.data?.message || 'Error'
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
.page { max-width: 400px; margin: 2rem auto; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
.message { color: green; }
</style>
