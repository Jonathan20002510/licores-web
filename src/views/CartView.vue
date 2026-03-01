<template>
  <div class="page">
    <!-- Estado vacío (como Flutter) -->
    <div v-if="cartStore.items.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <span class="empty-icon">🛒</span>
      </div>
      <h2 class="empty-title">Tu carrito está vacío</h2>
      <p class="empty-text">Agrega productos desde el inicio</p>
      <router-link to="/home" class="btn-primary btn-empty">Ver productos</router-link>
    </div>

    <template v-else>
      <!-- Header morado con gradiente -->
      <header class="cart-header">
        <div class="cart-header-icon-wrap">
          <span class="cart-header-icon">🛒</span>
        </div>
        <div class="cart-header-text">
          <h1 class="cart-title">Tu Carrito</h1>
          <p class="cart-count">{{ cartStore.items.length }} {{ cartStore.items.length === 1 ? 'producto' : 'productos' }}</p>
        </div>
      </header>

      <!-- Lista de productos (cards) -->
      <div class="cart-list">
        <div
          v-for="item in cartStore.items"
          :key="item.product_id"
          class="cart-card"
        >
          <div class="cart-card-img-wrap">
            <img :src="itemImage(item)" :alt="item.name" class="cart-card-img" />
          </div>
          <div class="cart-card-body">
            <h3 class="cart-card-name">{{ item.name }}</h3>
            <p class="cart-card-price">${{ formatPrice(item.price) }}</p>
            <div class="cart-card-qty">
              <button
                type="button"
                class="qty-btn qty-minus"
                aria-label="Menos"
                @click="setQty(item, item.quantity - 1)"
              >
                −
              </button>
              <span class="qty-value">{{ item.quantity }}</span>
              <button
                type="button"
                class="qty-btn qty-plus"
                aria-label="Más"
                @click="setQty(item, item.quantity + 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="cart-card-total">
            <span class="cart-card-total-amount">${{ itemTotal(item).toFixed(2) }}</span>
            <span class="cart-card-total-x">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>

      <!-- Footer: resumen + botón -->
      <footer class="cart-footer">
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span class="summary-value">${{ subtotalFixed }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">
              Envío
              <span v-if="loadingShipping" class="summary-loading"></span>
              <button
                v-else-if="hasLocation && shippingCost === null && !shippingError"
                type="button"
                class="summary-refresh"
                title="Recalcular"
                @click="loadShipping"
              >
                🔄
              </button>
            </span>
            <span :class="['summary-value', shippingTextClass]">{{ shippingText }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row summary-total">
            <span>Total</span>
            <span class="summary-total-value">${{ totalFixed }}</span>
          </div>
        </div>

        <!-- Aviso ubicación -->
        <div v-if="!hasLocation && !checkingLocation" class="location-warning">
          <span class="location-warning-icon">⚠️</span>
          <div class="location-warning-text">
            <strong>Ubicación requerida</strong>
            <p>Para calcular el costo de envío y realizar tu pedido, configura tu ubicación de entrega.</p>
          </div>
          <router-link to="/location" class="btn-location">Configurar Ubicación</router-link>
        </div>

        <p v-if="orderError" class="order-error">{{ orderError }}</p>
        <button
          type="button"
          class="btn-primary btn-order"
          :disabled="placingOrder || !hasLocation"
          @click="placeOrder"
        >
          {{ placingOrder ? 'Creando pedido...' : 'Crear pedido' }}
        </button>
      </footer>
    </template>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, type CartItem } from '../stores/cart'
import { http } from '../services/http'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const router = useRouter()
const cartStore = useCartStore()
const shippingCost = ref<number | null>(null)
const shippingError = ref<string | null>(null)
const hasLocation = ref(false)
const checkingLocation = ref(false)
const loadingShipping = ref(false)
const placingOrder = ref(false)
const orderError = ref('')

const subtotalFixed = computed(() => cartStore.subtotal.toFixed(2))

const totalWithShipping = computed(() => {
  const sub = cartStore.subtotal
  const ship = shippingCost.value
  if (ship === null) return sub
  return sub + ship
})

const totalFixed = computed(() => totalWithShipping.value.toFixed(2))

const shippingText = computed(() => {
  if (!hasLocation.value) return 'Requiere ubicación'
  if (shippingError.value) return 'No disponible en esta zona'
  if (loadingShipping.value) return 'Calculando...'
  if (shippingCost.value === null) return 'Calculando...'
  if (shippingCost.value === 0) return 'GRATIS'
  return `$${shippingCost.value.toFixed(2)}`
})

const shippingTextClass = computed(() => {
  if (!hasLocation.value) return 'text-warning'
  if (shippingError.value) return 'text-error'
  if (shippingCost.value === 0) return 'text-success'
  return ''
})

function formatPrice(p: string | number): string {
  const n = typeof p === 'string' ? parseFloat(p.replace(',', '.')) : p
  return Number.isNaN(n) ? '0.00' : n.toFixed(2)
}

function itemImage(item: CartItem): string {
  const img = item.image
  if (!img) return apiConfig.defaultImageUrl
  if (typeof img === 'string' && img.startsWith('http')) return img
  return `${apiConfig.storageBaseUrl}/${String(img).replace(/^\//, '')}`
}

function itemTotal(item: CartItem): number {
  const p = parseFloat(String(item.price).replace(',', '.'))
  return (Number.isNaN(p) ? 0 : p) * item.quantity
}

function setQty(item: CartItem, qty: number) {
  const next = Math.max(1, qty)
  cartStore.setQuantity(item.product_id, next)
}

async function checkUserLocation() {
  checkingLocation.value = true
  try {
    const res = await http.get('/user')
    const data = res.data?.data ?? res.data ?? {}
    const locDesc = (data.location_description ?? '').toString().trim()
    const lat = data.latitude != null
    const lng = data.longitude != null
    hasLocation.value = !!(locDesc && lat && lng)
  } catch (_) {
    hasLocation.value = false
  } finally {
    checkingLocation.value = false
  }
}

async function loadShipping() {
  if (cartStore.items.length === 0) return
  loadingShipping.value = true
  shippingError.value = null
  try {
    const originRes = await http.get('/origin-point/active')
    const data = originRes.data
    const coords = data?.origin_coordinates ?? data
    let lat: number | null = null
    let lng: number | null = null
    if (coords?.latitude != null && coords?.longitude != null) {
      lat = Number(coords.latitude)
      lng = Number(coords.longitude)
    }
    const userRes = await http.get('/user')
    const user = userRes.data?.data ?? userRes.data ?? {}
    if (user.latitude != null && user.longitude != null) {
      lat = Number(user.latitude)
      lng = Number(user.longitude)
    }
    if (lat != null && lng != null) {
      const res = await http.get(
        `/orders/calculate-shipping?latitude=${lat}&longitude=${lng}&subtotal=${cartStore.subtotal}`
      )
      const d = res.data
      if (d?.shipping_cost != null) {
        shippingCost.value = Number(d.shipping_cost)
      } else {
        shippingCost.value = null
        shippingError.value = d?.message ?? 'No disponible en esta zona'
      }
    } else {
      hasLocation.value = false
      shippingCost.value = null
    }
  } catch (_) {
    shippingCost.value = null
    shippingError.value = 'No se pudo calcular el envío'
  } finally {
    loadingShipping.value = false
  }
}

onMounted(async () => {
  await checkUserLocation()
  if (cartStore.items.length > 0) await loadShipping()
})

watch(() => cartStore.items.length, (len) => {
  if (len === 0) {
    shippingCost.value = null
    shippingError.value = null
  } else if (hasLocation.value) {
    loadShipping()
  }
})

async function placeOrder() {
  orderError.value = ''
  placingOrder.value = true
  try {
    const userRes = await http.get('/user')
    const user = userRes.data?.data ?? userRes.data ?? {}
    const name = (user.name ?? '').toString().trim()
    const phone = (user.phone ?? '').toString().trim()
    const locDesc = (user.location_description ?? '').toString().trim()
    const lat = user.latitude != null ? Number(user.latitude) : null
    const lng = user.longitude != null ? Number(user.longitude) : null
    if (!name || !phone) {
      orderError.value = 'Completa tu nombre y teléfono en Perfil.'
      return
    }
    const items = cartStore.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    const locationOk = lat != null && lng != null && locDesc
    const body: Record<string, unknown> = {
      items,
      address: {
        recipient_name: name,
        phone,
        address_line: locDesc || `Coordenadas: ${lat ?? 0}, ${lng ?? 0}`,
        latitude: lat,
        longitude: lng,
        reference: `Coordenadas: ${lat ?? 0}, ${lng ?? 0}`,
        sector: 'Tulcán',
      },
      userHasLocation: !!locationOk,
    }
    if (!locationOk) {
      body.location = {
        latitude: user.latitude?.toString() ?? '0',
        longitude: user.longitude?.toString() ?? '0',
        description: locDesc,
      }
    }
    const res = await http.post('/orders', body)
    const order = res.data?.order ?? res.data?.data ?? res.data
    const orderId = order?.id
    cartStore.clear()
    if (orderId != null) {
      await router.push(`/orders/${orderId}`)
    } else {
      await router.push('/orders')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const msg = err.response?.data?.message
    const errors = err.response?.data?.errors
    if (msg) orderError.value = msg
    else if (errors && typeof errors === 'object') {
      const first = Object.values(errors).flat()
      orderError.value = first[0] ?? 'Error al crear el pedido'
    } else {
      orderError.value = 'Error al crear el pedido. Revisa tu dirección en Perfil.'
    }
  } finally {
    placingOrder.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 80px;
  background: #f5f5f5;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
  text-align: center;
}
.empty-icon-wrap {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: rgba(138, 43, 226, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}
.empty-icon { font-size: 64px; }
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
.btn-empty {
  display: inline-block;
  padding: 14px 28px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
}

/* Header carrito */
.cart-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 20px 24px;
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 25%, #8A2BE2 50%, #9C4EDD 75%, #AB47BC 100%);
  box-sizing: border-box;
  max-width: 100%;
}
.cart-header-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-header-icon { font-size: 28px; }
.cart-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}
.cart-count {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

/* Lista productos */
.cart-list {
  padding: 0 16px 16px 280px;
  box-sizing: border-box;
  max-width: 100%;
}
.cart-card {
  display: flex;
  align-items: stretch;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.cart-card-img-wrap {
  flex-shrink: 0;
  width: 80px;
  min-width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
}
.cart-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-card-body {
  flex: 1 1 0%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
}
.cart-card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}
.cart-card-price {
  margin: 0;
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}
.cart-card-qty {
  display: inline-flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
}
.qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qty-plus { background: rgba(138, 43, 226, 0.1); color: #8a2be2; }
.qty-value {
  min-width: 32px;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
}
.cart-card-total {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 70px;
}
.cart-card-total-amount {
  font-size: 16px;
  font-weight: 700;
  color: #8a2be2;
  white-space: nowrap;
}
.cart-card-total-x {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* Footer */
.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  padding-bottom: calc(20px + 60px);
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  max-width: 100%;
}
.cart-summary {
  padding: 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(138, 43, 226, 0.05));
  border-radius: 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #333;
}
.summary-row + .summary-row { margin-top: 8px; }
.summary-value { font-weight: 600; }
.summary-label { display: flex; align-items: center; gap: 8px; }
.summary-loading {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-top-color: #8a2be2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.summary-refresh {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}
.text-warning { color: #e65100; }
.text-error { color: #c62828; }
.text-success { color: #2e7d32; font-weight: 700; }
.summary-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 12px 0;
}
.summary-total { font-size: 18px; }
.summary-total-value {
  font-size: 24px;
  font-weight: 700;
  color: #8a2be2;
}

.location-warning {
  margin-bottom: 12px;
  padding: 16px;
  background: #fff3e0;
  border: 1.5px solid #ffb74d;
  border-radius: 12px;
}
.location-warning-icon { font-size: 24px; }
.location-warning-text { margin: 8px 0 12px; }
.location-warning-text strong { color: #e65100; }
.location-warning-text p { margin: 4px 0 0; font-size: 14px; color: #bf360c; }
.btn-location {
  display: block;
  width: 100%;
  padding: 12px;
  text-align: center;
  background: #f57c00;
  color: #fff;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
}
.order-error {
  margin: 0 0 12px;
  padding: 10px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  font-size: 14px;
}
.btn-primary {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  background: #8a2be2;
  color: #fff;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-order { margin-top: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
