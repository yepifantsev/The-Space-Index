<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatLocationNavigation } from '../../section-helpers.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const satellites = computed(() =>
  [...(props.source.data?.satellites ?? [])].sort((a, b) => {
    const aTime = a.nextPass ? Date.parse(a.nextPass.time) : Number.POSITIVE_INFINITY
    const bTime = b.nextPass ? Date.parse(b.nextPass.time) : Number.POSITIVE_INFINITY
    if (Number.isNaN(aTime)) return 1
    if (Number.isNaN(bTime)) return -1
    return aTime - bTime
  }),
)

function displayName(name) {
  const base = typeof name === 'string' ? name : 'Unknown'
  return typeof name === 'string' && /^((CSS|ISS)(?:\s|$))/i.test(name) ? `${base} ⭐ ` : base
}
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div v-if="source.data == null" class="muted">Data not available yet.</div>
    <ul v-else class="satellite-list">
      <li
        v-for="satellite in satellites"
        :key="satellite.name"
        :class="`satellite-item${satellite.nextPass?.maxAltitude < 30 ? ' satellite-row-muted' : ''}`"
      >
        <strong>{{ displayName(satellite.name) }}</strong>
        <span v-if="satellite.nextPass" class="satellite-details">
          Next pass: {{ formatLocationNavigation(satellite.nextPass.time) }}
          · {{ Number.isFinite(satellite.nextPass.maxAltitude) ? satellite.nextPass.maxAltitude.toFixed(0) : '—' }}°
          · {{ typeof satellite.nextPass.direction === 'string' ? satellite.nextPass.direction : '—' }}
        </span>
      </li>
    </ul>
  </PanelCard>
</template>
