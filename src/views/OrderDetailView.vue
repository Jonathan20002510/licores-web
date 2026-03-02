<template>
  <div class="page">
    <!-- Loading -->
    <div v-if="loading && !order" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando detalles...</p>
    </div>

    <!-- Error -->
    <div v-else-if="!order" class="error-state">
      <div class="error-icon-wrap">
        <span class="error-icon">⚠</span>
      </div>
      <p class="error-msg">{{ errorMessage }}</p>
      <button type="button" class="btn-primary" @click="loadOrder">Reintentar</button>
      <router-link to="/orders" class="link-back">Volver a pedidos</router-link>
    </div>

    <template v-else>
      <header class="detail-header">
        <router-link to="/orders" class="btn-back" aria-label="Volver">←</router-link>
        <h1 class="detail-title">Pedido #{{ orderLabel }}</h1>
        <button type="button" class="btn-refresh-header" :disabled="loading" @click="loadOrder" aria-label="Actualizar">
          Actualizar
        </button>
      </header>

      <div class="detail-body">
        <!-- Estado -->
        <section class="card status-card">
          <div class="status-icon-wrap" :style="{ background: statusBgColor, color: statusColor }">
            <span class="status-icon">{{ statusIcon }}</span>
          </div>
          <div class="status-text">
            <span class="status-label">Estado</span>
            <span class="status-value" :style="{ color: statusColor }">{{ statusText }}</span>
            <template v-if="order.status === 'enviado' && shippedAt">
              <p class="status-shipped">Enviado a las {{ shippedAtTime }}</p>
              <p class="status-eta">Llegada estimada: 20 a 30 minutos desde entonces.</p>
            </template>
          </div>
        </section>

        <!-- WhatsApp -->
        <a
          v-if="whatsappLink && showWhatsAppCard"
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="card whatsapp-card"
        >
          <span class="whatsapp-icon">💬</span>
          <div class="whatsapp-text">
            <strong>¿Problema con tu pedido?</strong>
            <span>Contactar por WhatsApp</span>
          </div>
          <span class="whatsapp-arrow">›</span>
        </a>

        <!-- Información del pedido -->
        <h2 class="section-title">Información del Pedido</h2>
        <section class="card info-card">
          <div class="info-row">
            <span>Fecha</span>
            <span>{{ formatDate(order.ordered_at) }}</span>
          </div>
          <div v-if="addressLine" class="info-row">
            <span>Dirección</span>
            <span>{{ addressLine }}</span>
          </div>
          <div class="info-row">
            <span>Productos</span>
            <span>{{ orderItems.length }} {{ orderItems.length === 1 ? 'producto' : 'productos' }}</span>
          </div>
        </section>

        <!-- Productos -->
        <h2 class="section-title">Productos</h2>
        <div v-if="orderItems.length === 0" class="card empty-products">
          <p>No hay productos en este pedido</p>
        </div>
        <div v-else class="product-list">
          <div v-for="(item, idx) in orderItems" :key="idx" class="card product-card">
            <div class="product-img-wrap">
              <img :src="productImageUrl(item)" :alt="productName(item)" class="product-img" />
            </div>
            <div class="product-info">
              <span class="product-name">{{ productName(item) }}</span>
              <span class="product-meta">Cantidad: {{ item.quantity }}</span>
            </div>
            <span class="product-total">${{ itemSubtotal(item).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Resumen -->
        <h2 class="section-title">Resumen</h2>
        <section class="card summary-card">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ subtotalFixed }}</span>
          </div>
          <div class="summary-row">
            <span>Envío</span>
            <span>${{ shippingFixed }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row summary-total-row">
            <span>Total</span>
            <span class="summary-total-value">${{ totalFixed }}</span>
          </div>

          <!-- Estado del pago y comprobante -->
          <div v-if="hasPayment" class="payment-status-wrap" :class="paymentStatusClass">
            <div class="payment-status-row">
              <span class="payment-status-icon">{{ paymentStatusIcon }}</span>
              <span class="payment-status-text">{{ paymentStatusText }}</span>
            </div>
            <template v-if="paymentImageUrl">
              <p class="comprobante-label">Comprobante de pago:</p>
              <button type="button" class="comprobante-thumb-wrap" @click="showComprobanteModal = true">
                <img :src="paymentImageUrl" alt="Comprobante" class="comprobante-thumb" />
              </button>
            </template>
          </div>
        </section>

        <!-- Botón Realizar Pago (si pendiente y sin pago) -->
        <div v-if="order.status === 'pendiente' && !hasPayment" class="action-row">
          <router-link :to="`/orders/${route.params.id}/payment`" class="btn-pagar">
            💳 Realizar Pago
          </router-link>
        </div>

        <div class="back-row">
          <router-link to="/orders" class="link-back">← Volver a pedidos</router-link>
        </div>
      </div>
    </template>

    <!-- Modal comprobante -->
    <Teleport to="body">
      <div v-if="showComprobanteModal" class="modal-overlay" @click.self="showComprobanteModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Comprobante de Pago</h3>
            <button type="button" class="modal-close" @click="showComprobanteModal = false" aria-label="Cerrar">×</button>
          </div>
          <div class="modal-body" v-if="paymentImageUrl">
            <img :src="paymentImageUrl" alt="Comprobante" class="modal-img" />
          </div>
        </div>
      </div>
    </Teleport>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '../services/http'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const order = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const errorMessage = ref('')
const whatsappPhone = ref('')
const showComprobanteModal = ref(false)

const orderLabel = computed(() => {
  const seq = route.query.seq
  if (seq && String(seq).trim() !== '') return String(seq).trim()
  return order.value?.id ?? route.params.id ?? '—'
})

const deliveryAddress = computed(() => {
  const d = order.value
  return (d?.delivery_address ?? d?.deliveryAddress) as Record<string, unknown> | undefined
})

const addressLine = computed(() => {
  const addr = deliveryAddress.value
  return (addr?.address_line ?? addr?.addressLine) as string | undefined
})

const orderItems = computed(() => {
  const d = order.value
  const list = d?.items ?? d?.order_items
  return Array.isArray(list) ? list : []
})

const subtotal = computed(() => {
  const d = order.value
  if (d?.subtotal != null) return Number(d.subtotal)
  const items = orderItems.value as Array<{ quantity: number; price: string | number }>
  return items.reduce((sum, item) => {
    const p = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price)
    return sum + (Number.isNaN(p) ? 0 : p) * (item.quantity ?? 0)
  }, 0)
})

const shippingCost = computed(() => {
  const v = order.value?.shipping_cost
  return v != null ? Number(v) : 0
})

const total = computed(() => {
  const v = order.value?.total ?? order.value?.total_amount
  return v != null ? Number(v) : subtotal.value + shippingCost.value
})

const subtotalFixed = computed(() => subtotal.value.toFixed(2))
const shippingFixed = computed(() => shippingCost.value.toFixed(2))
const totalFixed = computed(() => total.value.toFixed(2))

const status = computed(() => (order.value?.status ?? 'pendiente').toString().toLowerCase())
const statusText = computed(() => {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return map[status.value] ?? status.value
})
const statusColor = computed(() => {
  const map: Record<string, string> = {
    pendiente: '#FF9800',
    pagado: '#2196F3',
    enviado: '#9C27B0',
    entregado: '#4CAF50',
    cancelado: '#F44336',
  }
  return map[status.value] ?? '#757575'
})
const statusBgColor = computed(() => `${statusColor.value}20`)
const statusIcon = computed(() => {
  const map: Record<string, string> = {
    pendiente: '⏳',
    pagado: '💳',
    enviado: '🚚',
    entregado: '✅',
    cancelado: '❌',
  }
  return map[status.value] ?? '📦'
})

const paymentData = computed(() => order.value?.payment as Record<string, unknown> | undefined)
const hasPayment = computed(() => !!paymentData.value)
const paymentStatus = computed(() => (paymentData.value?.status ?? '').toString().toLowerCase())

const paymentStatusText = computed(() => {
  if (status.value === 'pagado' && paymentStatus.value === 'verificado') return 'Pago confirmado'
  if (paymentStatus.value === 'rechazado') return 'Pago rechazado'
  if (status.value === 'pendiente' && hasPayment.value) return 'Validando pago'
  return 'Pago en proceso'
})
const paymentStatusIcon = computed(() => {
  if (status.value === 'pagado' && paymentStatus.value === 'verificado') return '✅'
  if (paymentStatus.value === 'rechazado') return '❌'
  return '💳'
})
const paymentStatusClass = computed(() => {
  if (paymentStatus.value === 'rechazado') return 'payment-rejected'
  if (status.value === 'pendiente' && hasPayment.value) return 'payment-pending'
  if (status.value === 'pagado' && paymentStatus.value === 'verificado') return 'payment-verified'
  return 'payment-process'
})

const paymentImageUrl = computed(() => {
  const p = paymentData.value
  if (!p) return ''
  let url = (p.image_url ?? p.image_path) as string | undefined
  if (url && !url.startsWith('http'))
    url = `${apiConfig.storageBaseUrl}/${String(url).replace(/^\//, '')}`
  return url ?? ''
})

const showWhatsAppCard = computed(() =>
  ['pagado', 'enviado', 'entregado'].includes(status.value)
)

const shippedAt = computed(() => {
  const raw = order.value?.shipped_at
  if (!raw) return null
  const d = typeof raw === 'string' ? new Date(raw) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
})
const shippedAtTime = computed(() => {
  const d = shippedAt.value
  if (!d) return ''
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const whatsappLink = computed(() => {
  if (!whatsappPhone.value) return ''
  const user = order.value?.user as Record<string, unknown> | undefined
  const name = (user?.name ?? '').toString().trim()
  const email = (user?.email ?? '').toString().trim()
  const lines = [
    `Hola, tengo una consulta sobre mi pedido #${orderLabel.value}.`,
    `Ref. interna: ${order.value?.id ?? ''}`,
  ]
  if (name) lines.push(`Nombre: ${name}`)
  if (email) lines.push(`Email: ${email}`)
  const msg = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${whatsappPhone.value}?text=${msg}`
})

function formatDate(val: unknown): string {
  if (val == null) return '—'
  const d = new Date(String(val))
  if (Number.isNaN(d.getTime())) return String(val)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function productName(item: Record<string, unknown>): string {
  const p = item.product as Record<string, unknown> | undefined
  return (p?.name ?? item.name ?? 'Producto') as string
}

function productImageUrl(item: Record<string, unknown>): string {
  const p = item.product as Record<string, unknown> | undefined
  const img = p?.image_url ?? p?.image
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (img) return `${apiConfig.storageBaseUrl}/${String(img).replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
}

function itemSubtotal(item: Record<string, unknown>): number {
  const q = Number(item.quantity) || 0
  const p = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price)
  return (Number.isNaN(p) ? 0 : p) * q
}

async function loadOrder() {
  const id = route.params.id
  if (!id) return
  errorMessage.value = ''
  loading.value = true
  try {
    const [orderRes, configRes] = await Promise.all([
      http.get(`/orders/${id}`),
      http.get('/app-config'),
    ])
    order.value = orderRes.data?.data ?? orderRes.data ?? null
    const phone = configRes.data?.whatsapp_support_phone
    if (phone && typeof phone === 'string') whatsappPhone.value = phone.replace(/\D/g, '')
  } catch (_) {
    order.value = null
    errorMessage.value = 'No se pudieron cargar los detalles del pedido. Revisa tu conexión.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})

watch(() => route.params.id, () => {
  order.value = null
  loadOrder()
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
  min-height: 40vh;
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

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
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
.error-icon { font-size: 40px; color: #f44336; }
.error-msg { margin: 0 0 24px; color: #333; }
.link-back {
  margin-top: 16px;
  color: #8a2be2;
  font-weight: 600;
  text-decoration: none;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #8A2BE2 100%);
  color: #fff;
}
.btn-back {
  color: #fff;
  text-decoration: none;
  font-size: 24px;
  line-height: 1;
  padding: 4px 8px;
  flex-shrink: 0;
}
.detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  flex: 1;
  min-width: 0;
}
.btn-refresh-header {
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
.btn-refresh-header:disabled { opacity: 0.6; cursor: not-allowed; }

.detail-body {
  padding: 16px 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  margin-bottom: 16px;
}

.status-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.status-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-icon { font-size: 28px; }
.status-text { flex: 1; min-width: 0; }
.status-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.status-value {
  font-size: 18px;
  font-weight: 700;
  display: block;
}
.status-shipped, .status-eta {
  margin: 8px 0 0;
  font-size: 13px;
  color: #555;
}
.status-eta { margin-top: 4px; }

.whatsapp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}
.whatsapp-card:hover { background: #f5f5f5; }
.whatsapp-icon { font-size: 28px; flex-shrink: 0; }
.whatsapp-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.whatsapp-text strong { color: #333; font-size: 14px; }
.whatsapp-text span { font-size: 13px; color: #666; }
.whatsapp-arrow { font-size: 18px; color: #666; }

.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.info-card .info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
}
.info-card .info-row span:first-child { color: #666; }
.info-card .info-row span:last-child { font-weight: 600; text-align: right; word-break: break-word; }

.empty-products {
  color: #666;
  text-align: center;
  padding: 20px;
}

.product-list { display: flex; flex-direction: column; gap: 8px; }
.product-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}
.product-img-wrap {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.product-name { font-weight: 600; color: #333; font-size: 14px; }
.product-meta { font-size: 12px; color: #666; }
.product-total { font-weight: 700; color: #8a2be2; flex-shrink: 0; }

.summary-card .summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
}
.summary-divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}
.summary-total-row { font-size: 18px; }
.summary-total-value {
  font-size: 20px;
  font-weight: 700;
  color: #8a2be2;
}

.payment-status-wrap {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
}
.payment-status-wrap.payment-verified {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}
.payment-status-wrap.payment-rejected {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
}
.payment-status-wrap.payment-pending {
  background: rgba(255, 152, 0, 0.1);
  color: #e65100;
}
.payment-status-wrap.payment-process {
  background: rgba(33, 150, 243, 0.1);
  color: #1565c0;
}
.payment-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.payment-status-icon { font-size: 18px; }
.comprobante-label {
  margin: 12px 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}
.comprobante-thumb-wrap {
  display: block;
  width: 100%;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}
.comprobante-thumb {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.action-row { margin: 16px 0; }
.btn-pagar {
  display: block;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  background: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.back-row { margin-top: 8px; text-align: center; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  max-width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #8a2be2;
  color: #fff;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
.modal-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.modal-body {
  padding: 16px;
  overflow: auto;
  max-height: 70vh;
}
.modal-img {
  width: 100%;
  height: auto;
  display: block;
}
</style>
