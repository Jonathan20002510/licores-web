<template>
  <div class="page">
    <!-- Loading -->
    <div v-if="loading && confirmedOrders.length === 0" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando pedidos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error && confirmedOrders.length === 0" class="error-state">
      <div class="error-icon-wrap">
        <span class="error-icon">⚠</span>
      </div>
      <p class="error-msg">{{ error }}</p>
      <button type="button" class="btn-primary" @click="loadOrders">Reintentar</button>
    </div>

    <!-- Empty -->
    <div v-else-if="confirmedOrders.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <span class="empty-icon">📋</span>
      </div>
      <h2 class="empty-title">No tienes pedidos aún</h2>
      <p class="empty-text">Realiza tu primer pedido desde el inicio</p>
    </div>

    <!-- Lista de pedidos -->
    <template v-else>
      <header class="orders-header">
        <div class="orders-header-icon-wrap">
          <span class="orders-header-icon">🛍</span>
        </div>
        <div class="orders-header-text">
          <h1 class="orders-title">Mis Pedidos</h1>
          <p class="orders-count">{{ confirmedOrders.length }} {{ confirmedOrders.length === 1 ? 'pedido' : 'pedidos' }}</p>
        </div>
      </header>

      <div class="orders-list">
        <article
          v-for="(order, index) in confirmedOrders"
          :key="order.id"
          class="order-card"
          :class="{ 'order-card-unread': order.has_unread_notification }"
          @click="goToDetail(order, index)"
        >
          <div class="order-card-inner">
            <div class="order-card-top">
              <div class="order-card-left">
                <span class="order-badge">#{{ sequentialNumber(index) }}</span>
                <div class="order-date">
                  <span class="order-date-icon">📅</span>
                  <span>{{ formatDate(order.ordered_at) }}</span>
                </div>
              </div>
              <div class="order-status-badge" :style="statusStyle(order.status)">
                <span class="order-status-icon">{{ statusIcon(order.status) }}</span>
                <span>{{ statusText(order.status) }}</span>
              </div>
            </div>
            <div class="order-divider"></div>
            <div class="order-info-row">
              <div class="order-info-items">
                <span class="order-info-icon">🛒</span>
                <span>{{ itemsCount(order) }} {{ itemsCount(order) === 1 ? 'producto' : 'productos' }}</span>
              </div>
              <span v-if="order.payment" class="order-pagado">✓ Pagado</span>
            </div>
            <div class="order-total-row">
              <span>Total</span>
              <span class="order-total-value">${{ orderTotal(order).toFixed(2) }}</span>
            </div>
          </div>
        </article>
      </div>

      <div class="refresh-row">
        <button type="button" class="btn-refresh" :disabled="loading" @click="loadOrders">
          {{ loading ? 'Actualizando...' : 'Actualizar lista' }}
        </button>
      </div>
    </template>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../services/http'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const orders = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const error = ref('')

const confirmedOrders = computed(() => {
  return orders.value.filter((o) => o.payment != null)
})

function sequentialNumber(index: number): number {
  return confirmedOrders.value.length - index
}

function itemsCount(order: Record<string, unknown>): number {
  const items = order.items ?? order.order_items
  return Array.isArray(items) ? items.length : 0
}

function orderTotal(order: Record<string, unknown>): number {
  const t = order.total ?? order.total_amount
  if (t != null) return Number(t)
  return 0
}

function formatDate(dateVal: unknown): string {
  if (dateVal == null) return 'Fecha no disponible'
  try {
    const d = new Date(String(dateVal))
    if (Number.isNaN(d.getTime())) return String(dateVal)
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  } catch {
    return String(dateVal)
  }
}

function statusText(status: unknown): string {
  const s = (status ?? '').toString().toLowerCase()
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return map[s] ?? String(status ?? '')
}

function statusIcon(status: unknown): string {
  const s = (status ?? '').toString().toLowerCase()
  const map: Record<string, string> = {
    pendiente: '⏳',
    pagado: '💳',
    enviado: '🚚',
    entregado: '✅',
    cancelado: '❌',
  }
  return map[s] ?? '📦'
}

function statusColor(status: unknown): string {
  const s = (status ?? '').toString().toLowerCase()
  const map: Record<string, string> = {
    pendiente: '#FF9800',
    pagado: '#2196F3',
    enviado: '#9C27B0',
    entregado: '#4CAF50',
    cancelado: '#F44336',
  }
  return map[s] ?? '#757575'
}

function statusStyle(status: unknown): { background: string; color: string } {
  const c = statusColor(status)
  return {
    background: `linear-gradient(135deg, ${c}, ${c}dd)`,
    color: '#fff',
  }
}

function goToDetail(order: Record<string, unknown>, index: number) {
  const id = order.id
  const seq = sequentialNumber(index)
  router.push({ path: `/orders/${id}`, query: { seq: String(seq) } })
}

async function loadOrders() {
  error.value = ''
  loading.value = true
  try {
    const res = await http.get('/orders')
    const data = res.data
    orders.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch (_) {
    if (orders.value.length === 0) {
      error.value = 'No se pudieron cargar los pedidos. Revisa tu conexión.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 80px;
  background: #f5f5f5;
  max-width: 100%;
  box-sizing: border-box;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 12px;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(138, 43, 226, 0.2);
  border-top-color: #8a2be2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 24px;
  text-align: center;
}
.error-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.error-icon {
  font-size: 40px;
  color: #f44336;
}
.error-msg {
  color: #333;
  margin: 0 0 24px;
  font-size: 16px;
}
.empty-icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(138, 43, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.empty-icon {
  font-size: 48px;
}
.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}
.empty-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
}

.btn-primary {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  background: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

/* Header */
.orders-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 20px 20px 24px;
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 25%, #8A2BE2 50%, #9C4EDD 75%, #AB47BC 100%);
  box-sizing: border-box;
}
.orders-header-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.orders-header-icon {
  font-size: 28px;
}
.orders-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}
.orders-count {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

/* Lista */
.orders-list {
  padding: 0 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.order-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}
.order-card-unread {
  background: #E3F2FD;
  border: 2px solid #2196F3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}
.order-card-inner {
  padding: 20px;
}
.order-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.order-card-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-badge {
  display: inline-block;
  padding: 6px 10px;
  background: rgba(138, 43, 226, 0.1);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #8a2be2;
  width: fit-content;
}
.order-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}
.order-date-icon {
  font-size: 14px;
}
.order-status-badge {
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.order-status-icon {
  font-size: 14px;
}
.order-divider {
  height: 1px;
  background: linear-gradient(90deg, #ddd, #eee, #ddd);
  margin: 16px 0;
}
.order-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.order-info-items {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}
.order-info-icon {
  font-size: 18px;
}
.order-pagado {
  padding: 6px 10px;
  background: rgba(76, 175, 80, 0.15);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #2e7d32;
}
.order-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(138, 43, 226, 0.05));
  border-radius: 12px;
  font-size: 14px;
  color: #333;
}
.order-total-value {
  font-size: 20px;
  font-weight: 700;
  color: #8a2be2;
}

.refresh-row {
  padding: 0 16px 24px;
  text-align: center;
}
.btn-refresh {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  background: #fff;
  color: #8a2be2;
  border: 2px solid #8a2be2;
  border-radius: 12px;
  cursor: pointer;
}
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
