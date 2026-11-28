<script setup>
import { onMounted, ref, watch } from 'vue'
import PanelCard from './PanelCard.vue'
import { renderNightSkyChart } from '../../section-helpers.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const chartHost = ref(null)

function renderChart() {
  if (!chartHost.value) return
  chartHost.value.replaceChildren()

  if (props.source.data == null) {
    const fallback = document.createElement('p')
    fallback.className = 'muted'
    fallback.textContent = 'Data not available yet.'
    chartHost.value.append(fallback)
    return
  }

  chartHost.value.append(
    renderNightSkyChart(
      props.source.data.forecastHours ?? props.source.data.nightHours ?? [],
    ),
  )
}

onMounted(renderChart)
watch(() => props.source.data, renderChart, { deep: true })
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <div ref="chartHost"></div>
  </PanelCard>
</template>
