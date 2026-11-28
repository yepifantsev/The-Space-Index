<script setup>
import { computed } from 'vue'
import PanelCard from './PanelCard.vue'
import { formatTime, isSafeUrl } from '../../h.js'

const props = defineProps({
  source: {
    type: Object,
    required: true,
  },
})

const articles = computed(() => props.source.data?.articles ?? [])
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
      <li v-for="article in articles" :key="article.url">
        <a
          v-if="typeof article.url === 'string' && isSafeUrl(article.url)"
          :href="article.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ article.title }}
        </a>
        <span v-else>{{ article.title }}</span>
        <br />
        <span class="muted">{{ article.site }} · {{ formatTime(article.publishedAt) }}</span>
      </li>
    </ul>
  </PanelCard>
</template>
