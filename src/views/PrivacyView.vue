<template>
  <div class="page">
    <h1>Política de privacidad</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else class="content" v-html="content"></div>
    <p><router-link to="/">Volver</router-link></p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { http } from '../services/http'

const content = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await http.get('/privacy')
    const data = res.data
    content.value = data?.content ?? data?.text ?? data?.body ?? JSON.stringify(data) ?? ''
  } catch (_) {
    content.value = 'No se pudo cargar la política de privacidad.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 1rem; }
.content { text-align: left; white-space: pre-wrap; }
</style>
