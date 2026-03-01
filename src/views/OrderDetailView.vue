<template>
  <div class="page">
    <div v-if="loading && !order" class="loading">Cargando...</div>
    <template v-else-if="order">
      <header class="header">
        <h1>Pedido #{{ order.id }}</h1>
        <button type="button" class="btn-primary" @click="loadOrder" :disabled="loading">Actualizar</button>
      </header>
      <p>Estado: {{ order.status }}</p>
      <p>Subtotal: {{ order.subtotal }}</p>
      <p v-if="order.shipping_cost != null">Envío: {{ order.shipping_cost }}</p>
      <p>Total: {{ order.total ?? order.total_amount }}</p>
      <ul class="items">
        <li v-for="(item, i) in (order.items ?? order.order_items ?? [])" :key="i">
          {{ item.product?.name ?? item.name }} × {{ item.quantity }} — {{ item.price ?? item.unit_price }}
        </li>
      </ul>
      <p v-if="whatsappPhone" class="support">
        <a :href="whatsappLink" target="_blank" rel="noopener">Contactar por WhatsApp</a>
      </p>
    </template>
    <p v-else>Pedido no encontrado</p>
    <router-link to="/orders">Volver a pedidos</router-link>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '../services/http'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const order = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const whatsappPhone = ref('')

const whatsappLink = computed(() => {
  if (!whatsappPhone.value) return ''
  const msg = encodeURIComponent(`Hola, consulta sobre mi pedido #${order.value?.id ?? ''}`)
  return `https://wa.me/${whatsappPhone.value}?text=${msg}`
})

async function loadOrder() {
  const id = route.params.id
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
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.page { padding: 1rem; padding-bottom: 60px; }
.header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.header h1 { margin: 0; font-size: 1.25rem; }
.btn-primary { background: #8a2be2; color: #fff; border: none; padding: 8px 16px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.loading { padding: 2rem; }
.items { list-style: none; padding: 0; }
.support { margin-top: 1rem; }
.support a { color: #25d366; font-weight: 600; }
</style>
