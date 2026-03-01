<template>
  <div class="page">
    <h1 class="page-title">Tú</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else>
      <!-- Tarjeta usuario (como Flutter: tap → perfil) -->
      <router-link to="/account" class="card user-card">
        <span class="avatar">👤</span>
        <div class="user-info">
          <span class="user-name">{{ user?.name ?? 'Usuario' }}</span>
          <span class="user-email">{{ user?.email ?? '' }}</span>
        </div>
        <span class="chevron">›</span>
      </router-link>

      <!-- Opciones de menú como en Flutter -->
      <nav class="menu">
        <router-link to="/location" class="menu-item">
          <span class="menu-icon">📍</span>
          <span class="menu-label">Dirección y ubicación</span>
          <span class="chevron">›</span>
        </router-link>
        <router-link to="/orders" class="menu-item">
          <span class="menu-icon">📋</span>
          <span class="menu-label">Mis pedidos</span>
          <span class="chevron">›</span>
        </router-link>
        <button type="button" class="menu-item menu-button" @click="showPasswordModal = true">
          <span class="menu-icon">🔒</span>
          <span class="menu-label">Cambiar contraseña</span>
          <span class="chevron">›</span>
        </button>
        <router-link to="/terms" class="menu-item">
          <span class="menu-icon">📄</span>
          <span class="menu-label">Términos y Condiciones</span>
          <span class="chevron">›</span>
        </router-link>
        <router-link to="/privacy" class="menu-item">
          <span class="menu-icon">🛡️</span>
          <span class="menu-label">Política de Privacidad</span>
          <span class="chevron">›</span>
        </router-link>
      </nav>

      <button type="button" @click="logout" class="btn-logout">Cerrar sesión</button>
    </template>

    <!-- Modal cambiar contraseña -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal">
        <h3>Cambiar contraseña</h3>
        <form @submit.prevent="changePassword" class="form">
          <p v-if="passwordError" class="error">{{ passwordError }}</p>
          <input v-model="currentPassword" type="password" placeholder="Contraseña actual" required />
          <input v-model="newPassword" type="password" placeholder="Nueva contraseña" required minlength="6" />
          <input v-model="confirmPassword" type="password" placeholder="Confirmar nueva contraseña" required />
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showPasswordModal = false">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="changingPassword">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../services/http'
import { useAuthStore } from '../stores/auth'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const user = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const changingPassword = ref(false)

onMounted(async () => {
  try {
    const res = await http.get('/user')
    user.value = res.data?.data ?? res.data ?? null
  } catch (_) {
    user.value = null
  } finally {
    loading.value = false
  }
})

async function changePassword() {
  passwordError.value = ''
  if (newPassword.value.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las nuevas contraseñas no coinciden'
    return
  }
  changingPassword.value = true
  try {
    await http.put('/user/profile', {
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    showPasswordModal.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    passwordError.value = err.response?.data?.message ?? 'Error al actualizar la contraseña'
  } finally {
    changingPassword.value = false
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; background: #f4f0fb; min-height: 100vh; }
.page-title { margin: 0 0 1rem; font-size: 1.25rem; }
.loading { padding: 2rem; }

.user-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #fff; border-radius: 18px; text-decoration: none; color: inherit; margin-bottom: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.avatar { width: 48px; height: 48px; border-radius: 50%; background: rgba(138,43,226,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.user-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.user-name { font-weight: 600; }
.user-email { font-size: 0.9em; color: #666; }
.chevron { color: #999; font-size: 1.2rem; }

.menu { display: flex; flex-direction: column; gap: 0.75rem; }
.menu-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #fff; border-radius: 18px; text-decoration: none; color: inherit; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.menu-button { width: 100%; border: none; cursor: pointer; font: inherit; text-align: left; }
.menu-icon { font-size: 1.4rem; }
.menu-label { flex: 1; font-size: 1rem; font-weight: 500; }

.btn-logout { margin-top: 1.5rem; padding: 14px 24px; width: 100%; border-radius: 18px; font-weight: 600; cursor: pointer; border: none; background: linear-gradient(135deg, #8b0000, #b22222, #dc143c); color: #fff; box-shadow: 0 4px 12px rgba(220,20,60,0.3); }
.btn-logout:hover { opacity: 0.95; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
.modal { background: #fff; border-radius: 18px; padding: 1.5rem; max-width: 400px; width: 100%; }
.modal h3 { margin: 0 0 1rem; }
.form { display: flex; flex-direction: column; gap: 0.75rem; }
.form input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #eee; color: #333; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; }
.error { color: #c62828; font-size: 0.9em; }
</style>
