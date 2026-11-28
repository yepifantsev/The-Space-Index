<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatLocationNavigation, formatLaunchStatus, launchStatusStyle } from '../../section-helpers.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const launches = computed(() => props.source.data?.launches ?? [])
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div v-if="source.data == null" class="muted">Data not available yet.</div>
    <ul v-else>
      <li v-for="launch in launches" :key="`${launch.name}-${launch.net}-${launch.location}`">
        <strong>{{ launch.name }}</strong>
        <br />
        <span class="muted">{{ formatLocationNavigation(launch.net) }}</span>
        <span
          v-if="launch.status"
          :style="launchStatusStyle(launch.status)"
          :class="launch.status === 'Success' ? 'launch-status launch-status-bold' : 'launch-status'"
        >
          · {{ formatLaunchStatus(launch.status) }}
        </span>
        <span v-if="launch.location" class="muted launch-location">
          <br />
          {{ launch.location }}
        </span>
      </li>
    </ul>
  </PanelCard>
</template>
