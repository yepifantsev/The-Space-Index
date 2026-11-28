<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatEasternNavigation } from './panel-helpers.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const showers = computed(() => props.source.data?.showers ?? [])
const comets = computed(() => props.source.data?.comets ?? [])
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div v-if="source.data == null" class="muted">Data not available yet.</div>
    <div v-else class="dense-card-content">
      <div class="muted">{{ source.data.verdict ?? 'Active meteor shower forecast' }}</div>
      <ul class="compact-list custom-bullet-list">
        <li v-for="shower in showers" :key="shower.name" class="custom-bullet meteor-bullet">
          <span class="bullet-glyph" aria-hidden="true">✨</span>
          <div class="meteor-row-content">
            <strong>{{ shower.name }}</strong>
            <div class="muted">
              Peak ZHR:
              <strong><em>{{ Number.isFinite(shower.zhr) ? String(Math.round(shower.zhr)) : '—' }}</em></strong>
              <template v-if="shower.peakUtc"> ({{ formatEasternNavigation(shower.peakUtc) }})</template>
            </div>
            <div class="zhr-meter">
              <span :style="`width: ${Math.max(2, Math.min(100, Number(shower.zhr) / 1.5))}%`"></span>
            </div>
          </div>
        </li>
      </ul>
      <strong>Bright comets</strong>
      <ul v-if="comets.length" class="compact-list custom-bullet-list">
        <li v-for="comet in comets" :key="comet.name" class="custom-bullet comet-bullet">
          <span class="bullet-glyph comet-glyph" aria-hidden="true">☄︎</span>
          <strong>{{ comet.name }}</strong>
          — magnitude {{ Number.isFinite(comet.magnitude) ? comet.magnitude.toFixed(1) : '—' }}
        </li>
      </ul>
      <p v-else class="muted">No binocular-visible comets currently reported.</p>
    </div>
  </PanelCard>
</template>
