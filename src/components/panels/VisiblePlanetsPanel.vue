<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatTime } from '../../h.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const planets = computed(() => props.source.data?.planets ?? [])
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
      <table class="planet-table">
        <thead>
          <tr>
            <th scope="col"> </th>
            <th scope="col">Rise / Set</th>
            <th scope="col"><em>m</em> / Max</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="planet in planets"
            :key="planet.name"
            :class="{ 'planet-row-muted': !planet.aboveHorizon }"
          >
            <td>
              <span
                class="planet-icon"
                role="img"
                :aria-label="planet.name"
              >
                {{ planet.icon }}
              </span>
            </td>
            <td>{{ formatTime(planet.rise) }} / {{ formatTime(planet.set) }}</td>
            <td>
              <strong>
                {{
                  planet.apparentMagnitude == null
                    ? '—'
                    : Number.isFinite(planet.apparentMagnitude)
                      ? planet.apparentMagnitude.toFixed(1)
                      : '—'
                }}
              </strong>
              /
              {{ planet.maximumElevationTime ? formatTime(planet.maximumElevationTime) : '—' }}
            </td>
            <td>{{ planet.constellation ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </PanelCard>
</template>
