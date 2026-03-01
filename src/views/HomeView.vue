<template>
  <div class="page">
    <!-- Zona morada superior: buscador + filtros (como Flutter) -->
    <header class="header-gradient">
      <div class="header-inner">
        <h1 class="header-title">Licores</h1>
        <router-link v-if="hasToken" to="/cart" class="cart-link">Carrito ({{ cartCount }})</router-link>
      </div>
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Buscar productos..."
        />
        <button
          type="button"
          class="filter-btn"
          :class="{ active: hasPriceFilter }"
          title="Filtrar por precio"
          @click="showPriceModal = true"
        >
          🎚️
        </button>
        <button
          type="button"
          class="filter-btn"
          :class="{ active: hasAlcoholFilter }"
          title="Filtrar por grados"
          @click="showAlcoholModal = true"
        >
          🍷
        </button>
      </div>
      <!-- Chips de filtros activos -->
      <div v-if="hasPriceFilter || hasAlcoholFilter" class="filter-chips">
        <span v-if="hasPriceFilter" class="chip">{{ priceFilterText }}</span>
        <span v-if="hasAlcoholFilter" class="chip">{{ alcoholFilterText }}</span>
      </div>
    </header>

    <!-- Categorías (gradiente morado, chips horizontales) -->
    <div class="categories-wrap">
      <div class="categories-scroll">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="category-chip"
          :class="{ selected: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div v-if="loading && products.length === 0" class="loading">Cargando...</div>
    <div v-else-if="loadError && products.length === 0" class="error-state">
      <p class="error-msg">{{ loadError }}</p>
      <button type="button" class="btn-primary" @click="loadProducts">Reintentar</button>
    </div>
    <div v-else>
      <!-- Banners carousel (se mueven solos + puntos) -->
      <section v-if="banners.length" class="banner-carousel">
        <div class="banner-track" :style="bannerTrackStyle">
          <a
            v-for="(b, i) in banners"
            :key="b.id"
            class="banner-slide"
            :style="bannerSlideStyle"
            :href="bannerLink(b)"
            :target="bannerLink(b) ? '_blank' : undefined"
            :rel="bannerLink(b) ? 'noopener' : undefined"
            @click.prevent="bannerLink(b) && openBannerLink(bannerLink(b)!)"
          >
            <img :src="bannerImage(b)" :alt="b.title" class="banner-img" />
          </a>
        </div>
        <div v-if="banners.length > 1" class="banner-dots">
          <span
            v-for="(_, i) in banners"
            :key="i"
            class="dot"
            :class="{ active: currentBannerIndex === i }"
            @click="goToBanner(i)"
          />
        </div>
      </section>

      <!-- Grid de productos -->
      <div v-if="filteredProducts.length === 0" class="empty">No hay productos disponibles</div>
      <div v-else class="product-grid">
        <router-link
          v-for="p in filteredProducts"
          :key="p.id"
          :to="`/product/${p.id}`"
          class="product-card"
        >
          <div class="product-img-wrap">
            <img :src="productImage(p)" :alt="p.name" class="product-img" />
          </div>
          <div class="product-info">
            <span class="product-name">{{ p.name }}</span>
            <span class="product-category">{{ productCategory(p) }}</span>
            <span class="product-price">{{ formatPrice(p.price) }}</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Modal filtro precio -->
    <div v-if="showPriceModal" class="modal-overlay" @click.self="showPriceModal = false">
      <div class="modal">
        <h3>Filtrar por Precio</h3>
        <div class="modal-fields">
          <input v-model.number="priceMinInput" type="number" step="0.01" placeholder="Mínimo ej. 10" />
          <input v-model.number="priceMaxInput" type="number" step="0.01" placeholder="Máximo ej. 50" />
        </div>
        <div class="quick-btns">
          <button type="button" @click="setQuickPrice(null, 10)">Menos de $10</button>
          <button type="button" @click="setQuickPrice(10, 25)">$10 - $25</button>
          <button type="button" @click="setQuickPrice(25, 50)">$25 - $50</button>
          <button type="button" @click="setQuickPrice(50, null)">Más de $50</button>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="clearPriceFilter(); showPriceModal = false">Limpiar</button>
          <button type="button" class="btn-primary" @click="applyPriceFilter(); showPriceModal = false">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- Modal filtro grados -->
    <div v-if="showAlcoholModal" class="modal-overlay" @click.self="showAlcoholModal = false">
      <div class="modal">
        <h3>Filtrar por Grados</h3>
        <div class="modal-fields">
          <input v-model.number="alcoholMinInput" type="number" step="0.1" placeholder="Mín % ej. 20" />
          <input v-model.number="alcoholMaxInput" type="number" step="0.1" placeholder="Máx % ej. 50" />
        </div>
        <div class="quick-btns">
          <button type="button" @click="setQuickAlcohol(null, 20)">Menos de 20%</button>
          <button type="button" @click="setQuickAlcohol(20, 40)">20% - 40%</button>
          <button type="button" @click="setQuickAlcohol(40, 60)">40% - 60%</button>
          <button type="button" @click="setQuickAlcohol(60, null)">Más de 60%</button>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="clearAlcoholFilter(); showAlcoholModal = false">Limpiar</button>
          <button type="button" class="btn-primary" @click="applyAlcoholFilter(); showAlcoholModal = false">Aplicar</button>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { http, getToken } from '../services/http'
import { useCartStore } from '../stores/cart'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const products = ref<Record<string, unknown>[]>([])
const banners = ref<Record<string, unknown>[]>([])
const search = ref('')
const selectedCategory = ref('Todos')
const loading = ref(true)
const loadError = ref('')
const cartStore = useCartStore()
const currentBannerIndex = ref(0)
let bannerTimer: ReturnType<typeof setInterval> | null = null

const showPriceModal = ref(false)
const showAlcoholModal = ref(false)
const priceMinInput = ref<number | ''>('')
const priceMaxInput = ref<number | ''>('')
const alcoholMinInput = ref<number | ''>('')
const alcoholMaxInput = ref<number | ''>('')
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const minAlcohol = ref<number | null>(null)
const maxAlcohol = ref<number | null>(null)

const hasToken = () => !!getToken()
const cartCount = computed(() => cartStore.itemCount)

const categories = computed(() => {
  const set = new Set<string>(['Todos'])
  products.value.forEach((p: Record<string, unknown>) => {
    const c = productCategory(p)
    if (c) set.add(c)
  })
  return Array.from(set)
})

const hasPriceFilter = computed(() => minPrice.value != null || maxPrice.value != null)
const hasAlcoholFilter = computed(() => minAlcohol.value != null || maxAlcohol.value != null)
const priceFilterText = computed(() => {
  if (minPrice.value != null && maxPrice.value != null) return `$${minPrice.value} - $${maxPrice.value}`
  if (minPrice.value != null) return `Desde $${minPrice.value}`
  if (maxPrice.value != null) return `Hasta $${maxPrice.value}`
  return ''
})
const alcoholFilterText = computed(() => {
  if (minAlcohol.value != null && maxAlcohol.value != null) return `${minAlcohol.value}% - ${maxAlcohol.value}%`
  if (minAlcohol.value != null) return `Desde ${minAlcohol.value}%`
  if (maxAlcohol.value != null) return `Hasta ${maxAlcohol.value}%`
  return ''
})

const filteredProducts = computed(() => {
  let list = products.value
  const cat = selectedCategory.value
  if (cat !== 'Todos') {
    list = list.filter((p: Record<string, unknown>) => productCategory(p) === cat)
  }
  const price = (p: Record<string, unknown>) => Number(p.price) || 0
  if (minPrice.value != null) list = list.filter((p: Record<string, unknown>) => price(p) >= minPrice.value!)
  if (maxPrice.value != null) list = list.filter((p: Record<string, unknown>) => price(p) <= maxPrice.value!)
  const deg = (p: Record<string, unknown>) => p.alcohol_degrees != null ? Number(p.alcohol_degrees) : null
  if (minAlcohol.value != null) list = list.filter((p: Record<string, unknown>) => (deg(p) ?? 0) >= minAlcohol.value!)
  if (maxAlcohol.value != null) list = list.filter((p: Record<string, unknown>) => (deg(p) ?? 100) <= maxAlcohol.value!)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p: Record<string, unknown>) =>
      String(p.name ?? '').toLowerCase().includes(q) ||
      String(productCategory(p)).toLowerCase().includes(q))
  }
  return list
})

const bannerTrackStyle = computed(() => {
  const n = banners.value.length || 1
  const pct = (currentBannerIndex.value * 100) / n
  return {
    width: `${n * 100}%`,
    transform: `translateX(-${pct}%)`,
  }
})
const bannerSlideStyle = computed(() => {
  const n = banners.value.length || 1
  const w = n ? 100 / n : 100
  return { flex: `0 0 ${w}%` }
})

function productCategory(p: Record<string, unknown>): string {
  const c = p.category_name ?? p.category
  if (typeof c === 'string') return c
  if (c && typeof c === 'object' && 'name' in c) return String((c as { name: unknown }).name)
  return ''
}

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

function bannerLink(b: Record<string, unknown>): string | null {
  const url = b.link_url ?? b.linkUrl ?? ''
  if (typeof url !== 'string' || !url.trim()) return null
  const u = url.trim()
  return u.startsWith('http') ? u : `https://${u}`
}

function openBannerLink(url: string) {
  window.open(url, '_blank', 'noopener')
}

function formatPrice(price: unknown): string {
  const n = Number(price)
  if (Number.isNaN(n)) return String(price)
  return `$${n.toFixed(2)}`
}

function goToBanner(i: number) {
  currentBannerIndex.value = i
  resetBannerTimer()
}

function startBannerTimer() {
  bannerTimer = setInterval(() => {
    if (banners.value.length <= 1) return
    currentBannerIndex.value = (currentBannerIndex.value + 1) % banners.value.length
  }, 4000)
}

function resetBannerTimer() {
  if (bannerTimer) clearInterval(bannerTimer)
  if (banners.value.length > 1) startBannerTimer()
}

function setQuickPrice(min: number | null, max: number | null) {
  priceMinInput.value = min ?? ''
  priceMaxInput.value = max ?? ''
}

function setQuickAlcohol(min: number | null, max: number | null) {
  alcoholMinInput.value = min ?? ''
  alcoholMaxInput.value = max ?? ''
}

function applyPriceFilter() {
  minPrice.value = priceMinInput.value === '' ? null : Number(priceMinInput.value)
  maxPrice.value = priceMaxInput.value === '' ? null : Number(priceMaxInput.value)
  if (minPrice.value != null && maxPrice.value != null && minPrice.value > maxPrice.value) {
    const t = minPrice.value
    minPrice.value = maxPrice.value
    maxPrice.value = t
  }
}

function clearPriceFilter() {
  minPrice.value = null
  maxPrice.value = null
  priceMinInput.value = ''
  priceMaxInput.value = ''
}

function applyAlcoholFilter() {
  minAlcohol.value = alcoholMinInput.value === '' ? null : Number(alcoholMinInput.value)
  maxAlcohol.value = alcoholMaxInput.value === '' ? null : Number(alcoholMaxInput.value)
  if (minAlcohol.value != null && maxAlcohol.value != null && minAlcohol.value > maxAlcohol.value) {
    const t = minAlcohol.value
    minAlcohol.value = maxAlcohol.value
    maxAlcohol.value = t
  }
}

function clearAlcoholFilter() {
  minAlcohol.value = null
  maxAlcohol.value = null
  alcoholMinInput.value = ''
  alcoholMaxInput.value = ''
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
    currentBannerIndex.value = 0
    if (banners.value.length > 1) startBannerTimer()
  } catch (_) {
    products.value = []
    banners.value = []
    loadError.value = 'No se pudieron cargar los productos. Revisa tu conexión.'
  } finally {
    loading.value = false
  }
}

watch(banners, (b) => {
  if (b.length > 1 && !bannerTimer) startBannerTimer()
  if (b.length <= 1 && bannerTimer) {
    clearInterval(bannerTimer)
    bannerTimer = null
  }
})

onMounted(() => {
  loadProducts()
})

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped>
.page { padding-bottom: 60px; background: #f5f5f5; min-height: 100vh; }

/* Header gradiente morado como Flutter */
.header-gradient {
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 25%, #8A2BE2 50%, #9C4EDD 75%, #AB47BC 100%);
  padding: 1rem 1rem 0.75rem;
  color: #fff;
}
.header-inner { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.header-title { margin: 0; font-size: 1.35rem; font-weight: 700; }
.cart-link { color: #fff; text-decoration: none; font-weight: 600; }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border-radius: 30px; padding: 10px 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
.search-icon { font-size: 1.1rem; opacity: 0.7; }
.search-input { flex: 1; border: none; outline: none; font-size: 1rem; background: transparent; }
.filter-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
  background: #e0e0e0; font-size: 1rem; display: flex; align-items: center; justify-content: center;
}
.filter-btn.active { background: #8A2BE2; color: #fff; }

.filter-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip {
  background: rgba(255,255,255,0.9); color: #8A2BE2; padding: 6px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}

/* Categorías */
.categories-wrap {
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 25%, #8A2BE2 50%, #9C4EDD 75%, #AB47BC 100%);
  padding: 10px 0 12px;
}
.categories-scroll {
  display: flex; gap: 10px; overflow-x: auto; padding: 0 12px;
  scrollbar-width: none; -ms-overflow-style: none;
}
.categories-scroll::-webkit-scrollbar { display: none; }
.category-chip {
  flex-shrink: 0; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer;
  font-size: 14px; font-weight: 600; white-space: nowrap;
  background: #fff; color: #333;
}
.category-chip.selected {
  background: linear-gradient(135deg, #B8860B, #DAA520, #FFD700, #FFE44D, #FFF176);
  color: #000; box-shadow: 0 2px 8px rgba(255,215,0,0.3);
}

.loading { padding: 2rem; text-align: center; }
.error-state { text-align: center; padding: 2rem 1.5rem; }
.error-msg { color: #333; margin-bottom: 1rem; }
.btn-primary { background: #8A2BE2; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; }

/* Banners carousel */
.banner-carousel {
  position: relative; width: 100%; margin: 8px 0;
  height: 130px; overflow: hidden; border-radius: 12px;
}
.banner-track {
  display: flex; width: 100%; height: 100%; transition: transform 0.3s ease-in-out;
}
.banner-slide {
  height: 100%; border-radius: 12px; overflow: hidden;
  text-decoration: none; color: inherit;
  box-sizing: border-box; padding: 0 4px;
}
.banner-img {
  width: 100%; height: 100%; object-fit: cover; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.banner-dots {
  position: absolute; bottom: 8px; left: 0; right: 0;
  display: flex; justify-content: center; gap: 6px;
}
.dot {
  width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5);
  cursor: pointer; transition: background 0.2s;
}
.dot.active { background: #fff; }

.empty { text-align: center; padding: 2rem; color: #666; }

/* Grid productos (estilo Flutter: card, categoría, precio verde) */
.product-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px;
}
.product-card {
  background: #fff; border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column;
}
.product-img-wrap { aspect-ratio: 1; overflow: hidden; }
.product-img {
  width: 100%; height: 100%; object-fit: contain; display: block;
}
.product-info { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
.product-name { font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-category { font-size: 12px; color: #888; }
.product-price { font-weight: 700; font-size: 16px; color: #22C55E; margin-top: 4px; }

/* Modales filtros */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem;
}
.modal {
  background: #fff; border-radius: 20px; padding: 1.5rem; max-width: 360px; width: 100%;
}
.modal h3 { margin: 0 0 1rem; font-size: 1.1rem; }
.modal-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.modal-fields input {
  padding: 12px; border: 1px solid #ddd; border-radius: 12px; font-size: 1rem;
}
.quick-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem; }
.quick-btns button {
  padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(138,43,226,0.3);
  background: rgba(138,43,226,0.1); color: #8A2BE2; font-size: 12px; font-weight: 600; cursor: pointer;
}
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-secondary { background: #eee; color: #333; border: none; padding: 10px 18px; border-radius: 12px; cursor: pointer; }
</style>
