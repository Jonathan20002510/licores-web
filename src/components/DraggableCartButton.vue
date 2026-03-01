<template>
  <Transition name="fade">
    <div
      v-if="cartStore.itemCount > 0"
      ref="btnRef"
      class="cart-fab"
      :class="{ dragging }"
      :style="positionStyle"
      @mousedown="onPointerDown($event as MouseEvent)"
      @touchstart.passive="onPointerDown($event as TouchEvent)"
    >
      <span class="cart-fab-icon">🛒</span>
      <span class="cart-fab-badge">{{ badgeText }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const emit = defineEmits<{ tap: [] }>()
const router = useRouter()
const cartStore = useCartStore()
const btnRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const pos = ref<{ x: number; y: number } | null>(null)
const dragStart = ref<{ x: number; y: number; startX: number; startY: number } | null>(null)
const pointerMoved = ref(false)

const badgeText = computed(() => {
  const n = cartStore.itemCount
  return n > 99 ? '99+' : String(n)
})

const positionStyle = computed(() => {
  if (pos.value) return { left: `${pos.value.x}px`, top: `${pos.value.y}px` }
  return { right: '20px', bottom: '90px' }
})

function onPointerDown(e: MouseEvent | TouchEvent) {
  const isTouch = 'touches' in e
  const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
  const clientY = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
  if (!pos.value) {
    const rect = (e.target as HTMLElement).closest('.cart-fab')?.getBoundingClientRect()
    if (rect) pos.value = { x: rect.left, y: rect.top }
  }
  dragging.value = false
  pointerMoved.value = false
  dragStart.value = pos.value ? { x: clientX, y: clientY, startX: pos.value.x, startY: pos.value.y } : null
  if (isTouch) {
    window.addEventListener('touchmove', onPointerMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { once: true })
  } else {
    e.preventDefault()
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!dragStart.value || !pos.value) return
  const isTouch = 'touches' in e
  const clientX = isTouch ? (e as TouchEvent).touches[0]?.clientX ?? dragStart.value.x : (e as MouseEvent).clientX
  const clientY = isTouch ? (e as TouchEvent).touches[0]?.clientY ?? dragStart.value.y : (e as MouseEvent).clientY
  const dx = clientX - dragStart.value.x
  const dy = clientY - dragStart.value.y
  if (!pointerMoved.value && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) pointerMoved.value = true
  if (pointerMoved.value) dragging.value = true
  const w = window.innerWidth - 60
  const h = window.innerHeight - 120
  pos.value = {
    x: Math.max(0, Math.min(w, dragStart.value.startX + dx)),
    y: Math.max(60, Math.min(h, dragStart.value.startY + dy)),
  }
}

function onPointerUp(e: MouseEvent | TouchEvent) {
  const isTouch = 'touches' in e
  if (isTouch) return
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  if (!pointerMoved.value && dragStart.value) {
    emit('tap')
    router.push('/cart')
  }
  dragStart.value = null
  setTimeout(() => { dragging.value = false }, 100)
}

function onTouchEnd() {
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onTouchEnd)
  if (!pointerMoved.value && dragStart.value) {
    emit('tap')
    router.push('/cart')
  }
  dragStart.value = null
  setTimeout(() => { dragging.value = false }, 100)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onPointerMove)
  window.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
.cart-fab {
  position: fixed;
  z-index: 150;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #673AB7;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}
.cart-fab.dragging {
  transform: scale(1.1);
  cursor: grabbing;
}
.cart-fab-icon {
  font-size: 28px;
  line-height: 1;
}
.cart-fab-badge {
  position: absolute;
  right: 2px;
  top: 2px;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  border-radius: 50%;
  background: #e53935;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
