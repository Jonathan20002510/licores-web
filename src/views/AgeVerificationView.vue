<template>
  <div class="page">
    <h1>Verificación de edad y términos</h1>
    <p>Debes ser mayor de edad y aceptar los términos y la política de privacidad para continuar.</p>
    <form @submit.prevent="submit" class="form">
      <label><input v-model="ageVerified" type="checkbox" /> Confirmo que soy mayor de edad</label>
      <label><input v-model="termsAccepted" type="checkbox" /> Acepto los <router-link to="/terms" target="_blank">términos</router-link></label>
      <label><input v-model="privacyAccepted" type="checkbox" /> Acepto la <router-link to="/privacy" target="_blank">política de privacidad</router-link></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading || !ageVerified || !termsAccepted || !privacyAccepted">
        {{ loading ? 'Enviando...' : 'Continuar' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../services/http'
import { getAcceptTermsUrl } from '../config/api'

const router = useRouter()
const ageVerified = ref(false)
const termsAccepted = ref(false)
const privacyAccepted = ref(false)
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!ageVerified.value || !termsAccepted.value || !privacyAccepted.value) return
  error.value = ''
  loading.value = true
  try {
    await http.post(getAcceptTermsUrl(), {
      age_verified: true,
      terms_accepted: true,
      privacy_accepted: true,
    })
    await router.push('/home')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { max-width: 480px; margin: 2rem auto; padding: 1rem; }
.form { display: flex; flex-direction: column; gap: 1rem; margin: 1rem 0; }
.form label { display: flex; align-items: center; gap: 0.5rem; }
</style>
