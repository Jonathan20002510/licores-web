<template>
  <div class="page">
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else-if="product">
      <div class="card">
        <div class="product-img-wrap">
          <img :src="productImage" :alt="product.name" class="product-img" />
        </div>
        <h1 class="product-name">{{ product.name }}</h1>
        <span class="category-chip">{{ productCategory(product) }}</span>
        <p v-if="product.description" class="description">{{ product.description }}</p>

        <div class="meta-row">
          <span class="meta-icon">📦</span>
          <span>Stock disponible: {{ stock }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-icon">🍷</span>
          <span>{{ alcoholText }}</span>
        </div>
        <div class="price-row">
          <span class="meta-icon">💰</span>
          <span class="price">{{ formatPrice(product.price) }}</span>
        </div>

        <!-- Subtotal de este producto en el carrito -->
        <div v-if="quantityInCart > 0" class="cart-subtotal">
          <div class="cart-subtotal-head">
            <span class="cart-icon">🛒</span>
            <span>Subtotal de este producto</span>
          </div>
          <div class="cart-subtotal-body">
            <span>{{ quantityInCart }} {{ quantityInCart === 1 ? 'unidad' : 'unidades' }} × {{ formatPrice(product.price) }}</span>
            <strong>{{ formatPrice(productSubtotal) }}</strong>
          </div>
        </div>

        <!-- Stock / En carrito -->
        <div v-if="stock > 0" class="stock-line">
          <span :class="availableStock > 0 ? 'stock-ok' : 'stock-out'">
            Stock disponible: {{ availableStock }}
          </span>
          <span v-if="quantityInCart > 0" class="in-cart">(En carrito: {{ quantityInCart }})</span>
        </div>

        <div class="actions">
          <div class="qty-row">
            <label>Cantidad</label>
            <input v-model.number="qty" type="number" min="1" :max="Math.max(availableStock, 1)" class="qty" />
          </div>
          <button
            type="button"
            class="btn-primary btn-add"
            :disabled="!hasToken || availableStock <= 0 || isAdding"
            @click="addToCart"
          >
            <span v-if="isAdding" class="btn-spinner"></span>
            <span v-else>🛒</span>
            <span>{{ addButtonText }}</span>
          </button>
        </div>
      </div>

      <!-- Botón flotante del carrito (arrastrable, rojo con número) -->
      <DraggableCartButton @tap="goToCart" />
    </template>
    <p v-else class="not-found">Producto no encontrado</p>
    <NavBar v-if="hasToken" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http, getToken } from '../services/http'
import { useCartStore } from '../stores/cart'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'
import DraggableCartButton from '../components/DraggableCartButton.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const product = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const qty = ref(1)
const isAdding = ref(false)

const hasToken = () => !!getToken()

const productImage = computed(() => {
  if (!product.value) return apiConfig.defaultImageUrl
  const img = product.value.image ?? product.value.image_url ?? ''
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (typeof img === 'string' && img) return `${apiConfig.storageBaseUrl}/${String(img).replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
})

function productCategory(p: Record<string, unknown>): string {
  const c = p.category_name ?? p.category
  if (typeof c === 'string') return c
  if (c && typeof c === 'object' && 'name' in c) return String((c as { name: unknown }).name)
  return ''
}

const stock = computed(() => {
  const s = product.value?.stock
  if (s == null) return 99
  return Number(s) || 0
})

const quantityInCart = computed(() => {
  if (!product.value?.id) return 0
  const item = cartStore.items.find((i) => i.product_id === Number(product.value!.id))
  return item?.quantity ?? 0
})

const availableStock = computed(() => Math.max(0, stock.value - quantityInCart.value))

const productSubtotal = computed(() => {
  const p = Number(product.value?.price) || 0
  return p * quantityInCart.value
})

const alcoholText = computed(() => {
  const d = product.value?.alcohol_degrees ?? product.value?.alcoholDegrees
  if (d == null) return 'Grados de alcohol: No especificado'
  return `Grados de alcohol: ${Number(d).toFixed(1)}%`
})

const addButtonText = computed(() => {
  if (isAdding.value) return 'Agregando...'
  if (stock.value <= 0) return 'Sin stock disponible'
  if (availableStock.value <= 0) return 'Stock agotado'
  return 'Agregar al carrito'
})

function formatPrice(price: unknown): string {
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  return `$${n.toFixed(2)}`
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await http.get(`${apiConfig.products}/${id}`)
    product.value = res.data?.data ?? res.data ?? null
  } catch (_) {
    product.value = null
  } finally {
    loading.value = false
  }
})

function addToCart() {
  if (!product.value || availableStock.value <= 0 || isAdding.value) return
  isAdding.value = true
  const name = String(product.value.name ?? '')
  const price = String(product.value.price ?? '0')
  const image = product.value.image ?? product.value.image_url
  const maxQty = Math.min(qty.value, availableStock.value)
  cartStore.addItem(
    Number(product.value.id),
    name,
    price,
    maxQty,
    typeof image === 'string' ? image : undefined
  )
  qty.value = 1
  setTimeout(() => { isAdding.value = false }, 400)
}

function goToCart() {
  router.push('/cart')
}
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 80px; background: #f4f0fb; min-height: 100vh; }
.loading { padding: 2rem; }
.not-found { text-align: center; padding: 2rem; }

.card {
  background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.product-img-wrap {
  height: 240px; width: 100%; background: #f5f5f5; border-radius: 16px; overflow: hidden; margin-bottom: 24px;
}
.product-img { width: 100%; height: 100%; object-fit: contain; display: block; }
.product-name { font-size: 22px; font-weight: 700; color: #333; margin: 0 0 6px; }
.category-chip {
  display: inline-block; padding: 4px 10px; border-radius: 20px;
  background: rgba(138, 43, 226, 0.1); color: #8a2be2; font-size: 13px; font-weight: 500; margin-bottom: 18px;
}
.description { font-size: 16px; line-height: 1.5; color: #555; margin: 0 0 20px; }

.meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 15px; color: #333; }
.meta-icon { font-size: 18px; }
.price-row { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
.price { font-size: 22px; font-weight: 700; color: #22C55E; }

.cart-subtotal {
  margin-bottom: 20px; padding: 16px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(138,43,226,0.1), rgba(138,43,226,0.05));
  border: 1px solid rgba(138,43,226,0.3);
}
.cart-subtotal-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; color: #444; }
.cart-icon { font-size: 18px; }
.cart-subtotal-body { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #666; }
.cart-subtotal-body strong { font-size: 22px; color: #8a2be2; }

.stock-line { margin-bottom: 12px; font-size: 14px; }
.stock-ok { color: #22C55E; font-weight: 500; }
.stock-out { color: #e65100; font-weight: 500; }
.in-cart { color: #666; margin-left: 6px; }

.actions { margin-top: 24px; }
.qty-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.qty-row label { font-weight: 500; }
.qty { width: 70px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 1rem; }
.btn-add {
  width: 100%; padding: 16px; border-radius: 14px; font-size: 16px;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
}
.btn-add:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spinner {
  width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
