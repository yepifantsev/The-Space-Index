<script setup>
import { computed } from 'vue'
import { isSafeUrl } from '../../h.js'
import { formatLocationNavigation } from '../../section-helpers.js'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: [String, Number, Date],
    default: null,
  },
  attribution: {
    type: [Object, Array],
    default: null,
  },
})

const attributionLinks = computed(() => {
  const items = Array.isArray(props.attribution)
    ? props.attribution
    : props.attribution
      ? [props.attribution]
      : []

  return items.filter((item) =>
    item
    && typeof item.label === 'string'
    && typeof item.url === 'string'
    && isSafeUrl(item.url),
  )
})
</script>

<template>
  <section :id="id" class="card">
    <h2>{{ title }}</h2>

    <div class="card-body">
      <slot />
    </div>

    <p class="meta">
      Updated: {{ formatLocationNavigation(updatedAt) }}
      <template v-if="attributionLinks.length">
        <span> · Source: </span>
        <template
          v-for="(item, index) in attributionLinks"
          :key="`${item.label}-${item.url}-${index}`"
        >
          <span v-if="index > 0"> · </span>
          <a :href="item.url" target="_blank" rel="noopener noreferrer">
            {{ item.label }}
          </a>
        </template>
      </template>
    </p>
  </section>
</template>
