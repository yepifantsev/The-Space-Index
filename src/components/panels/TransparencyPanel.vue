<script setup>
import MetricPanel from './MetricPanel.vue'

defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const metric = {
  type: 'transparency',
  title: 'Atmosphere Transparency',
  yLabel: 'Extinction (mag / air mass)',
  min: 0.2,
  max: 1.2,
  ticks: [
    { value: 0.2, label: '0.2' },
    { value: 0.4, label: '0.4' },
    { value: 0.6, label: '0.6' },
    { value: 0.8, label: '0.8' },
    { value: 1, label: '1.0' },
    { value: 1.2, label: '1.2+' },
  ],
  legendTitle: 'Transparency',
  legendLeft: 'Exceptional (< 0.3)',
  legendRight: 'Very poor (> 1.0)',
  gradient: [
    { offset: '0%', color: '#061160' },
    { offset: '100%', color: '#aaaaaa' },
  ],
}
</script>

<template>
  <MetricPanel :source="source" :metric="metric" />
</template>
