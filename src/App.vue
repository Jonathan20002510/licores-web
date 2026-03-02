<template>
  <div v-if="!isMobile" class="desktop-block">
    <div class="desktop-block-card">
      <span class="desktop-block-icon">📱</span>
      <h1 class="desktop-block-title">Solo disponible en móviles</h1>
      <p class="desktop-block-text">
        Esta aplicación está diseñada para usarse en teléfonos. Abre este enlace desde tu celular para continuar.
      </p>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isMobile = ref(false)

// Solo el ancho REAL de la pantalla (no cambia al redimensionar ni en DevTools).
// PC: screen.width = 1920, 1366... → bloqueado. Teléfono: 390, 414... → permitido.
function checkMobile(): boolean {
  if (typeof screen === 'undefined') return false
  return screen.width <= 1024
}

onMounted(() => {
  isMobile.value = checkMobile()
  if (isMobile.value) {
    const meta = document.querySelector('meta[name="viewport"]')
    if (meta) meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
  }
})
</script>

<style scoped>
.desktop-block {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0d0d0d 100%);
  box-sizing: border-box;
}
.desktop-block-card {
  max-width: 400px;
  padding: 48px 32px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  text-align: center;
}
.desktop-block-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 24px;
}
.desktop-block-title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #212121;
}
.desktop-block-text {
  margin: 0;
  font-size: 15px;
  color: #616161;
  line-height: 1.5;
}
</style>
