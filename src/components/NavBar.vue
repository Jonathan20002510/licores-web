<template>
  <nav v-if="showNav" class="nav">
    <router-link to="/home" class="nav-link">Inicio</router-link>
    <router-link to="/orders" class="nav-link">Pedidos</router-link>
    <router-link to="/cart" class="nav-link">Carrito</router-link>
    <router-link to="/profile" class="nav-link">Tú</router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getToken } from '../services/http'

const route = useRoute()

const showNav = computed(() => {
  if (!getToken()) return false
  const name = route.name as string
  return ['Home', 'Orders', 'Cart', 'Profile'].includes(name)
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
  padding: 0.5rem 0;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}
.nav-link {
  color: #333;
  text-decoration: none;
  font-size: 0.9em;
}
.nav-link.router-link-active {
  color: #8a2be2;
  font-weight: 700;
}
</style>
