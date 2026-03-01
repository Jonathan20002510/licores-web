<template>
  <nav v-if="showNav" class="nav">
    <router-link to="/home" class="nav-link">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">Inicio</span>
    </router-link>
    <router-link to="/orders" class="nav-link">
      <span class="nav-icon">📋</span>
      <span class="nav-label">Pedidos</span>
    </router-link>
    <router-link to="/cart" class="nav-link">
      <span class="nav-icon-wrap">
        <span class="nav-icon">🛒</span>
        <span v-if="cartCount > 0" class="nav-badge">{{ cartBadgeText }}</span>
      </span>
      <span class="nav-label">Carrito</span>
    </router-link>
    <router-link to="/profile" class="nav-link">
      <span class="nav-icon">👤</span>
      <span class="nav-label">Tú</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getToken } from '../services/http'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const cartStore = useCartStore()

const showNav = computed(() => {
  if (!getToken()) return false
  const name = route.name as string
  return ['Home', 'Orders', 'Cart', 'Profile'].includes(name)
})

const cartCount = computed(() => cartStore.itemCount)
const cartBadgeText = computed(() => {
  const n = cartCount.value
  return n > 99 ? '99+' : String(n)
})
</script>

<style scoped>
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0 0.6rem;
  padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #666;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover {
  color: #8a2be2;
}
.nav-link.router-link-active {
  color: #8a2be2;
  font-weight: 700;
}
.nav-link.router-link-active .nav-icon {
  background: #8a2be2;
  color: #fff;
  box-shadow: 0 2px 8px rgba(138, 43, 226, 0.35);
}
.nav-icon-wrap {
  position: relative;
  display: inline-block;
}
.nav-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: #f0f0f0;
  color: #666;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}
.nav-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 50%;
  background: #e53935;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-label {
  line-height: 1.2;
}
</style>
