<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatTime } from '../../h.js'
import { formatEasternNavigation } from '../../section-helpers.js'
import {
  altitudeStatus,
  azimuthToCompass,
  calculateLiveMoon,
} from '../../formatters/moon-timeline.formatter.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const liveMoon = ref(null)
let timer = null

function refreshLiveMoon() {
  const location = props.source.data?.location
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lon)) {
    liveMoon.value = null
    return
  }
  liveMoon.value = calculateLiveMoon(location.lat, location.lon)
}

onMounted(() => {
  refreshLiveMoon()
  timer = window.setInterval(refreshLiveMoon, 60 * 1000)
})

onUnmounted(() => {
  if (timer != null) window.clearInterval(timer)
})

const moon = computed(() => ({
  ...(props.source.data?.moon ?? {}),
  ...(liveMoon.value ?? {}),
}))
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div v-if="source.data == null" class="muted">Data not available yet.</div>
    <div v-else>
      <div class="moon-summary mt-1">
        <span class="moon-glyph" role="img" :aria-label="moon.name">
          {{ moon.glyph ?? '◐' }}
        </span>
        <div>
          <strong class="moon-name">{{ moon.name ?? 'Moon phase' }}</strong>
          <div class="muted moon-illumination">{{ moon.illumination ?? '—' }}% illuminated</div>
        </div>
      </div>

      <div :class="`moon-info mt-1${moon.aboveHorizon === false ? ' muted' : ''}`">
        Altitude:
        <strong class="moon-altitude">
          {{ Number.isFinite(moon.altitude) ? `${moon.altitude.toFixed(1)}° (${altitudeStatus(moon.altitude)})` : '—' }}
        </strong>
      </div>
      <div :class="`moon-info${moon.aboveHorizon === false ? ' muted' : ''}`">
        Azimuth:
        <strong class="moon-azimuth">
          {{ Number.isFinite(moon.azimuth) ? `${moon.azimuth.toFixed(1)}° (${azimuthToCompass(moon.azimuth)})` : '—' }}
        </strong>
      </div>
      <div :class="`moon-info mt-1${moon.aboveHorizon === false ? ' muted' : ''}`">
        Magnitude:
        <strong class="moon-apparent-magnitude">
          {{ Number.isFinite(moon.apparentMag) ? moon.apparentMag.toFixed(2) : '—' }}
        </strong>
      </div>
      <div :class="`moon-info${moon.aboveHorizon === false ? ' muted' : ''}`">
        Sky glow:
        <strong class="moon-sky-glow">
          {{ Number.isFinite(moon.zenithSkySqm) ? `${moon.zenithSkySqm.toFixed(2)} mag/arcsec²` : '—' }}
        </strong>
      </div>
      <div class="moon-info mt-1">Moonrise: <strong>{{ formatTime(source.data.moonrise) }}</strong></div>
      <div class="moon-info">Moonset: <strong>{{ formatTime(source.data.moonset) }}</strong></div>
      <div class="moon-info mt-1">
        Last phase:
        <strong>
          {{ moon.previousPhase?.name ?? '—' }} ·
          {{ moon.previousPhase?.time ? formatEasternNavigation(moon.previousPhase.time) : '—' }}
        </strong>
      </div>
      <div class="moon-info">
        Next phase:
        <strong>
          {{ moon.nextPhase?.name ?? '—' }} ·
          {{ moon.nextPhase?.time ? formatEasternNavigation(moon.nextPhase.time) : '—' }}
        </strong>
      </div>
    </div>
  </PanelCard>
</template>
