<template>
  <div class="page">
    <h1>Nueva contraseña</h1>
    <form @submit.prevent="submit" class="form">
      <p v-if="error" class="error">{{ error }}</p>
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="tokenInput" type="text" placeholder="Token (del correo)" required />
      <input v-model="password" type="password" placeholder="Nueva contraseña" required minlength="6" />
      <button type="submit" :disabled="loading">{{ loading ? 'Guardando...' : 'Guardar' }}</button>
    </form>
    <p><router-link to="/login">Volver a iniciar sesión</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { getResetPasswordUrl } from '../config/api'

const route = useRoute()
const email = ref('')
const tokenInput = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  const q = route.query
  if (q.email) email.value = String(q.email)
  if (q.token) tokenInput.value = String(q.token)
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const res = await axios.post(getResetPasswordUrl(), {
      email: email.value.trim(),
      token: tokenInput.value.trim(),
      password: password.value,
    }, { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } })
    if (res.status === 200) {
      window.location.href = '/login'
    } else {
      error.value = res.data?.message || 'Error'
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { max-width: 400px; margin: 2rem auto; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
</style>
