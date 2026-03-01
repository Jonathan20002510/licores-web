<template>
  <div class="page">
    <h1 class="page-title">Mi cuenta</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else-if="user">
      <div class="card form-card">
        <p v-if="saveMessage" class="message" :class="saveError ? 'error' : 'success'">
          {{ saveMessage }}
        </p>
        <form @submit.prevent="saveProfile" class="form">
          <label class="label">Nombre</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="Tu nombre"
            required
          />
          <label class="label">Teléfono.</label>
          <input
            v-model="form.phone"
            type="tel"
            class="input"
            placeholder="Ej: 0991234567"
          />
          <label class="label">Correo electrónico</label>
          <p class="email-readonly">{{ user.email }}</p>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </form>
      </div>

    </template>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../services/http'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const user = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const form = ref({ name: '', phone: '' })

onMounted(async () => {
  try {
    const res = await http.get(apiConfig.user)
    const data = res.data?.data ?? res.data ?? null
    user.value = data
    if (data) {
      form.value = {
        name: String(data.name ?? ''),
        phone: String(data.phone ?? ''),
      }
    }
  } catch (_) {
    user.value = null
  } finally {
    loading.value = false
  }
})

async function saveProfile() {
  saveMessage.value = ''
  saveError.value = false
  saving.value = true
  try {
    const res = await http.put(apiConfig.userProfile, {
      name: form.value.name.trim(),
      phone: form.value.phone.trim() || null,
    })
    const updated = res.data?.user ?? res.data?.data ?? res.data
    if (updated) user.value = updated
    saveMessage.value = 'Datos guardados correctamente.'
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    saveMessage.value = err.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.'
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; background: #f4f0fb; min-height: 100vh; }
.page-title { margin: 0 0 1rem; font-size: 1.25rem; }
.loading { padding: 2rem; }

.card { background: #fff; border-radius: 18px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.form-card { margin-bottom: 1rem; }
.info-card { margin-bottom: 1rem; }
.info-card p { margin: 0 0 0.5rem; }
.link { color: #8a2be2; text-decoration: none; font-size: 0.95em; }

.form { display: flex; flex-direction: column; gap: 0.75rem; }
.label { font-weight: 600; font-size: 0.95em; }
.input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 12px; font-size: 1rem; }
.email-readonly { margin: 0; padding: 0.75rem; background: #f5f5f5; border-radius: 12px; color: #666; font-size: 1rem; }

.message { margin: 0 0 0.75rem; padding: 0.5rem; border-radius: 8px; font-size: 0.9em; }
.message.success { background: #e8f5e9; color: #2e7d32; }
.message.error { background: #ffebee; color: #c62828; }

.btn-primary { margin-top: 0.5rem; background: #8a2be2; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
