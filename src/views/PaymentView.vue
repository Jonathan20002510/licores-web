<template>
  <div class="page">
    <div v-if="loading && !orderData" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p>Cargando...</p>
    </div>

    <template v-else-if="orderData">
      <header class="payment-header">
        <h1 class="payment-title">Confirmar pago</h1>
        <router-link :to="`/orders/${orderId}`" class="btn-back" aria-label="Volver">←</router-link>
      </header>

      <div class="payment-body">
        <!-- Dirección de entrega (clickeable para editar) -->
        <router-link
          :to="{ path: '/location', query: { fromPayment: '1', orderId: orderId } }"
          class="address-card"
        >
          <span class="address-icon">📍</span>
          <div class="address-text">
            <strong>{{ deliveryAddress?.recipient_name }}</strong>
            <span>{{ deliveryAddress?.phone }}</span>
            <span>{{ deliveryAddress?.address_line }}</span>
          </div>
          <span class="address-chevron">›</span>
        </router-link>

        <!-- Resumen del pedido -->
        <h2 class="section-title">Resumen del pedido</h2>
        <div class="order-items">
          <div
            v-for="(item, idx) in orderItems"
            :key="idx"
            class="order-item"
          >
            <div class="order-item-img-wrap">
              <img
                :src="itemImageUrl(item)"
                :alt="item.product?.name ?? 'Producto'"
                class="order-item-img"
              />
            </div>
            <div class="order-item-info">
              <span class="order-item-name">{{ item.product?.name ?? item.name ?? 'Producto' }}</span>
              <span class="order-item-meta">Cantidad: {{ item.quantity }} · ${{ formatNum(item.price) }} c/u</span>
            </div>
            <span class="order-item-subtotal">${{ itemSubtotal(item).toFixed(2) }}</span>
          </div>
        </div>

        <div class="order-divider"></div>
        <p class="summary-line">Subtotal: ${{ subtotalFixed }}</p>
        <p class="summary-line">Costo de envío: ${{ shippingFixed }}</p>
        <p class="summary-line summary-total">Total a pagar: ${{ totalFixed }}</p>

        <!-- Cuentas de destino -->
        <h2 class="section-title">Elige una cuenta de destino</h2>
        <div class="accounts-list">
          <label
            v-for="acc in accounts"
            :key="acc.id"
            class="account-radio"
            :class="{ selected: selectedAccountId === acc.id }"
          >
            <input
              type="radio"
              :value="acc.id"
              v-model="selectedAccountId"
              name="payment_account"
            />
            <span class="account-label">{{ acc.bank_name }} - {{ acc.account_number }}</span>
            <span class="account-holder">{{ acc.account_holder }}</span>
          </label>
        </div>

        <!-- Cuenta seleccionada (detalle + copiar) -->
        <div v-if="selectedAccount" class="selected-account-detail">
          <strong>Cuenta seleccionada:</strong>
          <p>Banco: {{ selectedAccount.bank_name }}</p>
          <p>Titular: {{ selectedAccount.account_holder }}</p>
          <div class="account-number-row">
            <span>Número: {{ selectedAccount.account_number }}</span>
            <button
              type="button"
              class="btn-copy"
              @click="copyAccountNumber"
              title="Copiar número"
            >
              Copiar
            </button>
          </div>
        </div>

        <!-- Comprobante -->
        <div class="comprobante-section">
          <button type="button" class="btn-select-image" @click="triggerFileInput">
            🖼️ Seleccionar comprobante
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="input-hidden"
            @change="onFileSelected"
          />
          <div v-if="selectedImagePreview" class="comprobante-preview">
            <img :src="selectedImagePreview" alt="Comprobante" class="comprobante-img" />
          </div>
        </div>

        <p v-if="submitError" class="submit-error">{{ submitError }}</p>
        <button
          type="button"
          class="btn-submit"
          :disabled="submitting || !canSubmit"
          @click="submitPayment"
        >
          {{ submitting ? 'Enviando...' : 'Enviar pago' }}
        </button>
      </div>
    </template>

    <div v-else class="error-state">
      <p>No se pudieron cargar los datos del pedido.</p>
      <router-link to="/orders" class="btn-primary">Ver pedidos</router-link>
    </div>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../services/http'
import { getToken } from '../services/http'
import { apiConfig } from '../config/api'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.id as string)

const orderData = ref<Record<string, unknown> | null>(null)
const accounts = ref<Record<string, unknown>[]>([])
const loading = ref(true)
const selectedAccountId = ref<number | null>(null)
const selectedFile = ref<File | null>(null)
const selectedImagePreview = ref<string | null>(null)
const submitting = ref(false)
const submitError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const selectedAccount = computed(() => {
  if (selectedAccountId.value == null) return null
  return accounts.value.find((a) => Number(a.id) === selectedAccountId.value) ?? null
})

const deliveryAddress = computed(() => {
  const d = orderData.value
  return (d?.delivery_address ?? d?.deliveryAddress) as Record<string, unknown> | undefined
})

const orderItems = computed(() => {
  const d = orderData.value
  const list = d?.items ?? d?.order_items
  return Array.isArray(list) ? list : []
})

const subtotal = computed(() => {
  const data = orderData.value
  if (data?.subtotal != null) return Number(data.subtotal)
  const items = (data?.items ?? []) as Array<{ quantity: number; price: string | number }>
  return items.reduce((sum, item) => {
    const p = typeof item.price === 'string' ? parseFloat(item.price) : item.price
    return sum + (Number.isNaN(p) ? 0 : p) * (item.quantity ?? 0)
  }, 0)
})

const shippingCost = computed(() => {
  const v = orderData.value?.shipping_cost
  return v != null ? Number(v) : 0
})

const total = computed(() => subtotal.value + shippingCost.value)
const subtotalFixed = computed(() => subtotal.value.toFixed(2))
const shippingFixed = computed(() => shippingCost.value.toFixed(2))
const totalFixed = computed(() => total.value.toFixed(2))

const canSubmit = computed(() => selectedAccountId.value != null && selectedFile.value != null)

function formatNum(val: unknown): string {
  const n = val != null ? Number(val) : 0
  return Number.isNaN(n) ? '0.00' : n.toFixed(2)
}

function itemImageUrl(item: Record<string, unknown>): string {
  const product = item.product as Record<string, unknown> | undefined
  const img = product?.image_url ?? product?.image
  if (typeof img === 'string' && img.startsWith('http')) return img
  if (img) return `${apiConfig.storageBaseUrl}/${String(img).replace(/^\//, '')}`
  return apiConfig.defaultImageUrl
}

function itemSubtotal(item: Record<string, unknown>): number {
  const q = Number(item.quantity) || 0
  const p = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price)
  return (Number.isNaN(p) ? 0 : p) * q
}

async function fetchAccounts() {
  try {
    const res = await http.get(apiConfig.paymentAccounts)
    const data = res.data
    accounts.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch (_) {
    accounts.value = []
  }
}

async function fetchOrderDetails() {
  const id = orderId.value
  if (!id) return
  loading.value = true
  submitError.value = ''
  try {
    const res = await http.get(`/orders/${id}`)
    orderData.value = res.data?.data ?? res.data ?? null
  } catch (_) {
    orderData.value = null
  } finally {
    loading.value = false
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    selectedFile.value = null
    selectedImagePreview.value = null
    return
  }
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    selectedImagePreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function copyAccountNumber() {
  if (!selectedAccount.value?.account_number) return
  const num = String(selectedAccount.value.account_number)
  navigator.clipboard?.writeText(num).then(() => {
    submitError.value = ''
    // podrías mostrar un toast "Copiado"
  })
}

async function submitPayment() {
  if (!selectedAccountId.value || !selectedFile.value || !orderData.value) {
    submitError.value = 'Selecciona una cuenta y sube el comprobante.'
    return
  }
  submitError.value = ''
  submitting.value = true
  try {
    const form = new FormData()
    form.append('order_id', orderId.value)
    form.append('amount', totalFixed.value)
    form.append('payment_account_id', String(selectedAccountId.value))
    form.append('image', selectedFile.value)

    const token = getToken()
    const baseURL = apiConfig.baseUrl
    const res = await fetch(`${baseURL}${apiConfig.payments}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    })

    const json = await res.json().catch(() => ({}))
    if (res.ok && (res.status === 200 || res.status === 201)) {
      await router.push(`/orders/${orderId.value}`)
      return
    }
    submitError.value = json.error ?? json.message ?? 'Error al enviar el pago.'
  } catch (_) {
    submitError.value = 'Error de conexión. Intenta de nuevo.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAccounts(), fetchOrderDetails()])
})

watch(orderId, () => {
  orderData.value = null
  fetchOrderDetails()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 80px;
  background: #f5f5f5;
  max-width: 100%;
  box-sizing: border-box;
  text-align: left;
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

.payment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 50%, #8A2BE2 100%);
  color: #fff;
}
.payment-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}
.btn-back {
  color: #fff;
  text-decoration: none;
  font-size: 24px;
  line-height: 1;
  padding: 4px 8px;
}

.payment-body {
  padding: 16px 20px;
  max-width: 100%;
}

.address-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  text-align: left;
}
.address-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.address-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.address-text strong { color: #333; }
.address-text span { font-size: 14px; color: #666; }
.address-chevron {
  font-size: 20px;
  color: #8a2be2;
  flex-shrink: 0;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.order-item-img-wrap {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
}
.order-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.order-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.order-item-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}
.order-item-meta {
  font-size: 12px;
  color: #666;
}
.order-item-subtotal {
  font-weight: 700;
  color: #8a2be2;
  flex-shrink: 0;
}

.order-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 16px 0;
}
.summary-line {
  margin: 0 0 6px;
  font-size: 15px;
  color: #333;
}
.summary-line.summary-total {
  font-weight: 700;
  font-size: 17px;
  color: #8a2be2;
  margin-top: 8px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
.account-radio {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid #eee;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.account-radio.selected {
  border-color: #8a2be2;
  background: rgba(138, 43, 226, 0.06);
}
.account-radio input { margin-right: 8px; }
.account-label { font-weight: 600; color: #333; }
.account-holder { font-size: 13px; color: #666; }

.selected-account-detail {
  padding: 12px 16px;
  margin-bottom: 20px;
  background: rgba(138, 43, 226, 0.08);
  border-radius: 12px;
  font-size: 14px;
  color: #333;
}
.selected-account-detail strong { display: block; margin-bottom: 8px; }
.selected-account-detail p { margin: 4px 0; }
.account-number-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.btn-copy {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  background: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.comprobante-section {
  margin-bottom: 20px;
}
.btn-select-image {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  background: #fff;
  color: #8a2be2;
  border: 2px solid #8a2be2;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}
.input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.comprobante-preview {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  max-height: 200px;
}
.comprobante-img {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  display: block;
}

.submit-error {
  margin: 0 0 12px;
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 10px;
  font-size: 14px;
}
.btn-submit {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  background: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-state {
  padding: 24px;
  text-align: center;
}
.error-state p { margin-bottom: 16px; color: #666; }
.btn-primary {
  display: inline-block;
  padding: 14px 24px;
  background: #8a2be2;
  color: #fff;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
}
</style>
