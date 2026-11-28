<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatEasternDate, formatEasternNavigation, kpColor } from '../../section-helpers.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const KP_INTERVAL_MS = 3 * 60 * 60 * 1000
const KP_WINDOW_MS = 24 * KP_INTERVAL_MS
const width = 760
const height = 416
const left = 46
const right = 748
const top = 20
const bottom = 352
const plotWidth = right - left
const plotHeight = bottom - top

const latest = computed(() => props.source.data?.latest ?? null)
const now = Date.now()
const start = now - KP_WINDOW_MS

const x = (time) => left + ((time - start) / KP_WINDOW_MS) * plotWidth
const y = (kp) => bottom - (kp / 9) * plotHeight

const readings = computed(() => {
  const rows = props.source.data?.kp
  if (!Array.isArray(rows)) return []

  return rows
    .map((reading) => ({
      time: Date.parse(reading.time),
      kp: Number(reading.kp),
    }))
    .filter((reading) =>
      Number.isFinite(reading.time)
      && Number.isFinite(reading.kp)
      && reading.kp >= 0
      && reading.kp <= 9,
    )
    .sort((first, second) => first.time - second.time)
})

const ticks = Array.from({ length: 10 }, (_, kp) => kp)
const dateTicks = computed(() =>
  readings.value
    .filter((_, index) => index % 8 === 0)
    .map((reading) => reading.time),
)

const bars = computed(() => readings.value.map((reading) => {
  const slotStart = Math.max(start, reading.time)
  const slotEnd = Math.min(now, reading.time + KP_INTERVAL_MS)
  if (slotEnd <= slotStart) return null

  return {
    x: x(slotStart),
    y: y(reading.kp),
    width: Math.max(0, (x(slotEnd) - x(slotStart)) * 0.84),
    height: Math.max(1, bottom - y(reading.kp)),
    color: kpColor(reading.kp),
  }
}).filter(Boolean))
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <template v-if="source.data == null">
      <p class="muted">Data not available yet.</p>
    </template>
    <template v-else>
      <span
        class="big big-after"
        :style="latest ? `color: ${kpColor(latest.kp)}` : undefined"
      >
        {{ latest ? `Kp ${latest.kp}` : 'No Kp reading' }}
      </span>
      <span v-if="latest" class="night-chart-range kp-as-of">
        as of {{ formatEasternNavigation(latest.time) }}
      </span>

      <svg
        class="kp-chart"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        aria-label="Planetary K-index readings over the last 72 hours. The vertical line marks now; times are UTC."
      >
        <template v-for="kp in ticks" :key="kp">
          <line
            :x1="left"
            :x2="right"
            :y1="y(kp)"
            :y2="y(kp)"
            :class="kp === 0 ? 'kp-axis' : 'kp-grid'"
          />
          <text
            :x="left - 10"
            :y="y(kp) + 4"
            class="kp-tick"
            text-anchor="end"
          >
            {{ kp }}
          </text>
        </template>

        <template v-for="time in dateTicks" :key="time">
          <line
            :x1="x(time)"
            :x2="x(time)"
            :y1="top"
            :y2="bottom"
            class="kp-grid kp-grid-vertical"
          />
          <text
            :x="x(time)"
            :y="bottom + 23"
            class="kp-tick"
            text-anchor="middle"
          >
            {{ formatEasternDate(time) }}
          </text>
        </template>

        <rect
          v-for="(bar, index) in bars"
          :key="index"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          rx="1"
          :fill="bar.color"
          class="kp-bar"
        />

        <line
          :x1="right"
          :x2="right"
          :y1="top"
          :y2="bottom"
          class="kp-now"
        />
        <text
          :x="right - 4"
          :y="top + 11"
          class="kp-now-label"
          text-anchor="end"
        >
          NOW
        </text>
        <text
          x="15"
          :y="top + plotHeight / 2"
          class="kp-axis-label"
          text-anchor="middle"
          :transform="`rotate(-90 15 ${top + plotHeight / 2})`"
        >
          Kp
        </text>
        <text
          :x="(left + right) / 2"
          y="402"
          class="kp-axis-label"
          text-anchor="middle"
        >
          Eastern Time
        </text>
      </svg>
      </template>

    <template v-if="source.data != null">
      <div class="meta">Planetary K-index readings over the last 72 hours.</div>
      <div class="meta">The vertical line marks now; times are UTC.</div>
    </template>
  </PanelCard>
</template>
