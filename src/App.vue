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
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(true)

function checkMobile(): boolean {
  if (typeof navigator === 'undefined') return true
  const ua = navigator.userAgent || navigator.vendor || ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Silk/i
  if (mobileRegex.test(ua)) return true
  if (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024) return true
  return false
}

let resizeHandler: () => void

onMounted(() => {
  isMobile.value = checkMobile()
  resizeHandler = () => { isMobile.value = checkMobile() }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
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
