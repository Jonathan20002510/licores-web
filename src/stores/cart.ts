import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  product_id: number
  name: string
  price: string
  quantity: number
  image?: string
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

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
