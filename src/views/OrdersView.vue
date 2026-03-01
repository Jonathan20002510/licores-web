<template>
  <div class="page">
    <header class="header">
      <h1>Mis pedidos</h1>
      <button v-if="orders.length && !loading" type="button" class="btn-primary btn-icon" @click="loadOrders" :disabled="loading">
        Actualizar
      </button>
    </header>
    <div v-if="loading && orders.length === 0" class="loading">Cargando...</div>
    <div v-else-if="error && orders.length === 0" class="error-state">
      <div class="error-icon">!</div>
      <p class="error-msg">{{ error }}</p>
      <button type="button" class="btn-primary" @click="loadOrders">Reintentar</button>
    </div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No tienes pedidos aún.</p>
    </div>
    <ul v-else class="order-list">
      <li v-for="o in orders" :key="o.id" class="order-item">
        <router-link :to="`/orders/${o.id}`">
          Pedido #{{ o.id }} — {{ formatStatus(o.status) }} — {{ formatTotal(o.total ?? o.total_amount) }}
        </router-link>
      </li>
    </ul>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../services/http'
import NavBar from '../components/NavBar.vue'

const orders = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')

function formatStatus(s: unknown): string {
  if (s == null) return ''
  return String(s)
}

function formatTotal(t: unknown): string {
  if (t == null) return '0'
  return typeof t === 'number' ? t.toFixed(2) : String(t)
}

async function loadOrders() {
  error.value = ''
  loading.value = true
  try {
    const res = await http.get('/orders')
    const data = res.data
    orders.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch (_) {
    if (orders.value.length === 0) error.value = 'No se pudieron cargar los pedidos. Revisa tu conexión.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; background: #f5f5f5; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 0 0 1rem; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-icon { padding: 8px 16px; font-size: 0.9em; }
.loading { padding: 2rem; text-align: center; }
.error-state, .empty-state { text-align: center; padding: 2rem 1.5rem; }
.error-icon { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: rgba(244,67,54,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #f44336; font-weight: bold; }
.empty-icon { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: rgba(138,43,226,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
.error-msg { color: #333; margin-bottom: 1.5rem; }
.order-list { list-style: none; padding: 0; margin: 0; background: #fff; border-radius: 8px; overflow: hidden; }
.order-item { padding: 0.75rem 1rem; border-bottom: 1px solid #eee; }
.order-item:last-child { border-bottom: none; }
.order-item a { color: inherit; text-decoration: none; display: block; }
</style>
