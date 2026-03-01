<template>
  <div class="page">
    <h1>Carrito</h1>
    <div v-if="cartStore.items.length === 0" class="empty">Carrito vacío. <router-link to="/home">Ver productos</router-link></div>
    <template v-else>
      <ul class="cart-list">
        <li v-for="item in cartStore.items" :key="item.product_id" class="cart-item">
          <span class="name">{{ item.name }}</span>
          <span class="price">{{ item.price }}</span>
          <div class="qty-controls">
            <button type="button" class="btn-qty" @click="setQty(item, item.quantity - 1)" aria-label="Menos">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button type="button" class="btn-qty" @click="setQty(item, item.quantity + 1)" aria-label="Más">+</button>
          </div>
          <button type="button" @click="cartStore.removeItem(item.product_id)" class="remove">Quitar</button>
        </li>
      </ul>
      <p class="subtotal">Subtotal: {{ subtotalFixed }}</p>
      <p v-if="shippingCost !== null" class="shipping">Envío: {{ shippingCost }}</p>
      <p v-if="orderError" class="error">{{ orderError }}</p>
      <button type="button" @click="placeOrder" :disabled="placingOrder" class="btn-primary btn-order">
        {{ placingOrder ? 'Creando pedido...' : 'Crear pedido' }}
      </button>
    </template>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, type CartItem } from '../stores/cart'
import { http } from '../services/http'
import { apiConfig } from '../config/api'

const router = useRouter()
const cartStore = useCartStore()
const shippingCost = ref<number | null>(null)
const userCoords = ref<{ lat: number; lng: number } | null>(null)
const placingOrder = ref(false)
const orderError = ref('')

const subtotalFixed = computed(() => cartStore.subtotal.toFixed(2))

function setQty(item: CartItem, qty: number) {
  const next = Math.max(1, qty)
  cartStore.setQuantity(item.product_id, next)
}

onMounted(async () => {
  if (cartStore.items.length === 0) return
  try {
    const originRes = await http.get('/origin-point/active')
    const data = originRes.data
    const coords = data?.origin_coordinates ?? data
    if (coords?.latitude != null && coords?.longitude != null) {
      userCoords.value = { lat: Number(coords.latitude), lng: Number(coords.longitude) }
    }
    if (userCoords.value) {
      const res = await http.get(
        `/orders/calculate-shipping?latitude=${userCoords.value.lat}&longitude=${userCoords.value.lng}&subtotal=${cartStore.subtotal}`
      )
      const d = res.data
      if (d?.shipping_cost != null) shippingCost.value = Number(d.shipping_cost)
      if (d?.origin_coordinates) userCoords.value = { lat: d.origin_coordinates.latitude, lng: d.origin_coordinates.longitude }
    }
  } catch (_) {
    shippingCost.value = null
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
    const hasLocation = lat != null && lng != null && locDesc
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
      userHasLocation: !!hasLocation,
    }
    if (!hasLocation) {
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
.page { padding: 1rem; padding-bottom: 60px; }
.empty { padding: 2rem; }
.cart-list { list-style: none; padding: 0; }
.cart-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 0; border-bottom: 1px solid #eee; flex-wrap: wrap; }
.name { flex: 1; min-width: 100px; }
.price { min-width: 60px; }
.qty-controls { display: flex; align-items: center; gap: 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
.btn-qty { width: 32px; height: 32px; border: none; background: #f5f5f5; font-size: 1.2rem; line-height: 1; cursor: pointer; }
.btn-qty:hover { background: #eee; }
.qty-value { min-width: 2rem; text-align: center; font-weight: 600; }
.remove { padding: 4px 8px; font-size: 0.85em; color: #c00; background: none; border: none; cursor: pointer; }
.subtotal, .shipping { font-weight: 600; margin: 1rem 0; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 14px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; width: 100%; max-width: 320px; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-order { margin-top: 0.5rem; }
</style>
