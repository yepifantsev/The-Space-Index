<script setup>
import MetricPanel from './MetricPanel.vue'

defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const metric = {
  type: 'dew',
  title: 'Dew Point Spread',
  yLabel: 'Dew Point Spread',
  max: 18,
  ticks: [
    { value: 0, label: '≤ 1°F' },
    { value: 5, label: '5°F' },
    { value: 11, label: '11°F' },
    { value: 18, label: '> 18°F' },
  ],
  legendTitle: 'Dew point spread',
  legendLeft: 'Very Dry (> 18°F)',
  legendRight: 'Fog / Condensation (≤ 1°F)',
  gradient: [
    { offset: '0%', color: '#061160' },
    { offset: '25%', color: '#4369a5' },
    { offset: '50%', color: '#78a9c8' },
    { offset: '75%', color: '#e6a04a' },
    { offset: '100%', color: '#d66b63' },
  ],
}
</script>

<template>
  <MetricPanel :source="source" :metric="metric" />
</template>
