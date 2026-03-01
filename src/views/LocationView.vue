<template>
  <div class="page">
    <h1 class="page-title">Mi ubicación</h1>
    <div v-if="loading" class="loading">Cargando...</div>
    <template v-else>
      <!-- Mapa (como en Flutter) -->
      <div class="map-wrap">
        <div ref="mapRef" class="map"></div>
        <button
          type="button"
          class="btn-ubicarme"
          :disabled="gettingLocation"
          @click="useCurrentLocation"
          title="Ubicarme"
        >
          <span class="btn-ubicarme-icon">📍</span>
          <span>{{ gettingLocation ? 'Obteniendo...' : 'Ubicarme' }}</span>
        </button>
      </div>

      <!-- Mensaje si no hay ubicación guardada -->
      <p v-if="initialMessage" class="initial-message">{{ initialMessage }}</p>

      <!-- Dirección de referencia -->
      <div class="form">
        <label>
          <span class="label-text">Dirección de referencia</span>
          <textarea
            v-model="locationDescription"
            rows="3"
            placeholder="Ej: Casa blanca, portón negro - Frente al parque"
          />
        </label>
        <p class="hint">Describe características del lugar para facilitar la entrega</p>
        <button type="button" class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Guardando...' : 'Guardar ubicación' }}
        </button>
      </div>
      <p v-if="message" class="message" :class="{ error: isError }">{{ message }}</p>
    </template>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { http } from '../services/http'
import NavBar from '../components/NavBar.vue'

const DEFAULT_LAT = -0.305057
const DEFAULT_LNG = -78.457755

const mapRef = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

const loading = ref(true)
const saving = ref(false)
const gettingLocation = ref(false)
const message = ref('')
const isError = ref(false)
const initialMessage = ref('')
const locationDescription = ref('')
const latitude = ref<number>(DEFAULT_LAT)
const longitude = ref<number>(DEFAULT_LNG)

function initMap() {
  if (!mapRef.value) return
  map = L.map(mapRef.value).setView([latitude.value, longitude.value], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  const icon = L.divIcon({
    className: 'marker-pin',
    html: '<span style="background:#8a2be2;width:24px;height:24px;border-radius:50%;display:block;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
  marker = L.marker([latitude.value, longitude.value], { icon, draggable: true })
    .addTo(map!)
    .on('dragend', () => {
      const pos = marker!.getLatLng()
      latitude.value = pos.lat
      longitude.value = pos.lng
    })

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    latitude.value = lat
    longitude.value = lng
    marker?.setLatLng([lat, lng])
  })
}

function updateMapPosition() {
  const lat = latitude.value
  const lng = longitude.value
  marker?.setLatLng([lat, lng])
  map?.setView([lat, lng], map.getZoom())
}

onMounted(async () => {
  try {
    const res = await http.get('/user')
    const data = res.data?.data ?? res.data ?? {}
    locationDescription.value = data.location_description ?? ''
    const lat = data.latitude
    const lng = data.longitude
    if (lat != null && lng != null) {
      latitude.value = Number(lat)
      longitude.value = Number(lng)
      initialMessage.value = ''
    } else {
      initialMessage.value = '📍 Ubicación aún no registrada'
    }
  } catch (_) {
    initialMessage.value = 'No se pudo cargar la ubicación'
  } finally {
    loading.value = false
  }
  await nextTick()
  initMap()
})

watch([latitude, longitude], () => {
  if (map && marker) updateMapPosition()
})

function useCurrentLocation() {
  if (!navigator.geolocation) {
    message.value = 'Tu navegador no soporta geolocalización'
    isError.value = true
    return
  }
  gettingLocation.value = true
  message.value = ''
  initialMessage.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latitude.value = pos.coords.latitude
      longitude.value = pos.coords.longitude
      updateMapPosition()
      gettingLocation.value = false
    },
    () => {
      message.value = 'No se pudo obtener la ubicación. Revisa los permisos del navegador.'
      isError.value = true
      gettingLocation.value = false
    }
  )
}

async function save() {
  saving.value = true
  message.value = ''
  isError.value = false
  try {
    await http.put('/user/location', {
      latitude: latitude.value,
      longitude: longitude.value,
      location_description: locationDescription.value || undefined,
    })
    message.value = 'Ubicación guardada correctamente'
    initialMessage.value = ''
  } catch (_) {
    message.value = 'Error al guardar la ubicación'
    isError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page { padding: 0; padding-bottom: 60px; background: #f4f0fb; min-height: 100vh; }
.page-title { margin: 0; padding: 1rem 1rem 0.5rem; font-size: 1.25rem; }

.map-wrap { position: relative; width: 100%; height: 280px; }
.map { width: 100%; height: 100%; }

.btn-ubicarme {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: #8a2be2;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(138, 43, 226, 0.4);
}
.btn-ubicarme:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-ubicarme-icon { font-size: 1.2rem; }

.initial-message { margin: 12px 1rem 0; color: #c62828; font-weight: 600; }

.form { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.form label { display: flex; flex-direction: column; gap: 0.5rem; }
.label-text { font-weight: 500; }
.form textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  resize: vertical;
}
.hint { font-size: 0.9em; color: #666; margin: 0; }
.message { margin: 0 1rem 1rem; padding: 0.75rem; border-radius: 8px; background: #e8f5e9; }
.message.error { background: #ffebee; color: #c62828; }
.btn-primary {
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #8a2be2;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
