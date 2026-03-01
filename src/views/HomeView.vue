<template>
  <div class="page">
    <header class="header">
      <h1>Licores</h1>
      <router-link v-if="hasToken" to="/cart" class="cart-link">Carrito ({{ cartCount }})</router-link>
    </header>
    <div v-if="loading && products.length === 0" class="loading">Cargando...</div>
    <div v-else-if="loadError && products.length === 0" class="error-state">
      <p class="error-msg">{{ loadError }}</p>
      <button type="button" class="btn-primary" @click="loadProducts">Reintentar</button>
    </div>
    <div v-else>
      <section v-if="banners.length" class="banners">
        <img v-for="b in banners" :key="b.id" :src="bannerImage(b)" :alt="b.title" class="banner-img" />
      </section>
      <input v-model="search" type="search" placeholder="Buscar..." class="search" />
      <div class="product-grid">
        <router-link v-for="p in filteredProducts" :key="p.id" :to="`/product/${p.id}`" class="product-card">
          <img :src="productImage(p)" :alt="p.name" class="product-img" />
          <span class="product-name">{{ p.name }}</span>
          <span class="product-price">{{ p.price }}</span>
        </router-link>
      </div>
    </div>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { http, getToken } from '../services/http'
import { useCartStore } from '../stores/cart'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const products = ref<Record<string, unknown>[]>([])
const banners = ref<Record<string, unknown>[]>([])
const search = ref('')
const loading = ref(true)
const loadError = ref('')
const cartStore = useCartStore()

const hasToken = () => !!getToken()

const cartCount = computed(() => cartStore.itemCount)

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter((p: Record<string, unknown>) =>
    String(p.name ?? '').toLowerCase().includes(q))
})

function productImage(p: Record<string, unknown>): string {
  const img = p.image ?? p.image_url ?? ''
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (typeof img === 'string' && img) return `${apiConfig.storageBaseUrl}/${img.replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
}

function bannerImage(b: Record<string, unknown>): string {
  const img = b.image ?? b.image_url ?? ''
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (typeof img === 'string' && img) return `${apiConfig.storageBaseUrl}/${img.replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
}

async function loadProducts() {
  loadError.value = ''
  loading.value = true
  try {
    const [prodRes, banRes] = await Promise.all([
      http.get(apiConfig.products),
      http.get(apiConfig.banners),
    ])
    products.value = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data ?? [])
    banners.value = Array.isArray(banRes.data) ? banRes.data : (banRes.data?.data ?? [])
  } catch (_) {
    products.value = []
    banners.value = []
    loadError.value = 'No se pudieron cargar los productos. Revisa tu conexión.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.page { padding-bottom: 60px; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #fff; }
.cart-link { margin-left: auto; }
.loading { padding: 2rem; text-align: center; }
.banners { margin: 0 1rem 1rem; overflow-x: auto; white-space: nowrap; }
.banner-img { height: 140px; width: auto; margin-right: 8px; border-radius: 8px; object-fit: cover; }
.search { width: calc(100% - 2rem); margin: 0 1rem 1rem; padding: 0.5rem; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; padding: 1rem; }
.product-card { background: #fff; border-radius: 8px; padding: 0.5rem; text-align: center; text-decoration: none; color: inherit; }
.product-img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; }
.product-name { display: block; font-size: 0.9em; margin-top: 0.25rem; }
.product-price { display: block; font-weight: 600; color: #8a2be2; }
.error-state { text-align: center; padding: 2rem 1.5rem; }
.error-msg { color: #333; margin-bottom: 1rem; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }
</style>
