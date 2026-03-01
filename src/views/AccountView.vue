<template>
  <div class="page">
    <h1 class="page-title">Mi cuenta</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else-if="user">
      <div class="card">
        <p><strong>Nombre:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p v-if="user.phone"><strong>Teléfono:</strong> {{ user.phone }}</p>
        <p v-if="user.location_description"><strong>Dirección:</strong> {{ user.location_description }}</p>
      </div>
    </template>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../services/http'
import NavBar from '../components/NavBar.vue'

const user = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

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
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; background: #f4f0fb; min-height: 100vh; }
.page-title { margin: 0 0 1rem; font-size: 1.25rem; }
.loading { padding: 2rem; }
.card { background: #fff; border-radius: 18px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.card p { margin: 0 0 0.75rem; }
.card p:last-child { margin-bottom: 0; }
</style>
