import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const CART_STORAGE_KEY = 'licores_cart'

export interface CartItem {
  product_id: number
  name: string
  price: string
  quantity: number
  image?: string
}

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is CartItem =>
        i != null &&
        typeof i === 'object' &&
        typeof (i as CartItem).product_id === 'number' &&
        typeof (i as CartItem).name === 'string' &&
        typeof (i as CartItem).price === 'string' &&
        typeof (i as CartItem).quantity === 'number'
    )
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  } catch (_) {
    // ignore
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCartFromStorage())

  watch(
    items,
    (val) => saveCartToStorage(val),
    { deep: true }
  )

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + parseFloat(String(i.price).replace(',', '.')) * i.quantity, 0)
  )

  function addItem(productId: number, name: string, price: string, quantity = 1, image?: string) {
    const existing = items.value.find((i) => i.product_id === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ product_id: productId, name, price, quantity, image })
    }
  }

  function setQuantity(productId: number, quantity: number) {
    const item = items.value.find((i) => i.product_id === productId)
    if (item) {
      if (quantity <= 0) {
        items.value = items.value.filter((i) => i.product_id !== productId)
      } else {
        item.quantity = quantity
      }
    }
  }

  function removeItem(productId: number) {
    items.value = items.value.filter((i) => i.product_id !== productId)
  }

  function clear() {
    items.value = []
  }

  return { items, itemCount, subtotal, addItem, setQuantity, removeItem, clear }
})
