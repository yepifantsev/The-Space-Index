<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatCneosDate } from '../../section-helpers.js'
import { isSafeUrl } from '../../h.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const approaches = computed(() => props.source.data?.approaches ?? [])

function asteroidRotation(name) {
  if (typeof name !== 'string' || name.length < 2) return '0deg'
  const rotation =
    (name.charCodeAt(name.length - 2) * 7)
    + (name.charCodeAt(name.length - 1) * 11)
  return `${rotation % 360}deg`
}

function approachClass(missDistanceLd) {
  if (missDistanceLd < 1) return 'neo-approach neo-approach-critical'
  if (missDistanceLd < 5) return 'neo-approach neo-approach-close'
  return 'neo-approach'
}

function diameter(object) {
  if (object.estimatedDiameterKm == null) return '—'
  return Number.isFinite(object.estimatedDiameterKm)
    ? `${Math.round(object.estimatedDiameterKm * 1000).toLocaleString()} m Ø`
    : '—'
}
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div v-if="source.data == null" class="muted">
      Data not available yet.
    </div>
    <div v-else class="dense-card-content">
      <ul class="compact-list custom-bullet-list">
        <li
          v-for="object in approaches"
          :key="object.name"
          :class="approachClass(object.missDistanceLd)"
          :style="{ '--rock-rotation': asteroidRotation(object.name) }"
        >
          <span class="bullet-glyph asteroid-glyph" aria-hidden="true">🪨</span>
          <strong>
            <a
              v-if="typeof object.sbdbUrl === 'string' && isSafeUrl(object.sbdbUrl)"
              :href="object.sbdbUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ object.name }}
            </a>
            <span v-else>{{ object.name }}</span>
            <span class="muted"> · {{ formatCneosDate(object.date) }}</span>
          </strong>
          <div class="neo-details muted">
            <span>{{ diameter(object) }}</span>
            <span>
              {{
                Number.isFinite(object.relativeVelocityKph)
                  ? `${(object.relativeVelocityKph / 3600).toFixed(1)} km/s`
                  : '—'
              }}
            </span>
            <span>
              {{
                Number.isFinite(object.missDistanceLd)
                  ? `${object.missDistanceLd.toFixed(1)} LD`
                  : '—'
              }}
            </span>
          </div>
        </li>
      </ul>
      <p v-if="approaches.length === 0" class="muted">
        No close approaches reported for the next 30 days.
      </p>
    </div>
  </PanelCard>
</template>
