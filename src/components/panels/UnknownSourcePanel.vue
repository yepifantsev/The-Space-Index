<script setup>
import PanelCard from './PanelCard.vue'

defineProps({
  source: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <PanelCard
    :id="source.name"
    :title="source.title ?? source.name"
    :updated-at="source.updatedAt"
    :attribution="source.attribution"
  >
    <p class="muted">No panel exists for this source.</p>
  </PanelCard>
</template>
