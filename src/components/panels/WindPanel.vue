<script setup>
import MetricPanel from './MetricPanel.vue'

defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const metric = {
  type: 'wind',
  title: 'Wind',
  yLabel: 'Wind Speed (mph)',
  max: 20,
  ticks: [
    { value: 0, label: '0' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 15, label: '15' },
    { value: 20, label: '20+' },
  ],
  legendTitle: 'Wind',
  legendLeft: 'Calm (≤ 5 mph)',
  legendRight: 'Strong (≥ 18 mph)',
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
