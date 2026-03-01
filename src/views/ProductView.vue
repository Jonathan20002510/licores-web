<template>
  <div class="page">
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else-if="product">
      <img :src="productImage" :alt="product.name" class="product-img" />
      <h1>{{ product.name }}</h1>
      <p class="description">{{ product.description }}</p>
      <p class="price">{{ product.price }}</p>
      <p v-if="product.stock !== undefined">Stock: {{ product.stock }}</p>
      <div class="actions">
        <button type="button" @click="addToCart" :disabled="!hasToken" class="btn-primary">Añadir al carrito</button>
        <input v-model.number="qty" type="number" min="1" :max="product.stock ?? 99" class="qty" />
      </div>
    </template>
    <p v-else>Producto no encontrado</p>
    <NavBar v-if="hasToken" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { http, getToken } from '../services/http'
import { useCartStore } from '../stores/cart'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const cartStore = useCartStore()
const product = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const qty = ref(1)

const hasToken = () => !!getToken()

const productImage = computed(() => {
  if (!product.value) return apiConfig.defaultImageUrl
  const img = product.value.image ?? product.value.image_url ?? ''
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (typeof img === 'string' && img) return `${apiConfig.storageBaseUrl}/${String(img).replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
})

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
  if (!product.value) return
  const name = String(product.value.name ?? '')
  const price = String(product.value.price ?? '0')
  const image = product.value.image ?? product.value.image_url
  cartStore.addItem(
    Number(product.value.id),
    name,
    price,
    qty.value,
    typeof image === 'string' ? image : undefined
  )
  qty.value = 1
}
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; }
.loading { padding: 2rem; }
.product-img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; }
.description { color: #666; }
.price { font-size: 1.25rem; font-weight: 600; color: #8a2be2; }
.actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
.qty { width: 60px; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
