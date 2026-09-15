<template>
  <div class="empty-state">
    <div class="icon">{{ icon }}</div>
    <h3 class="title">{{ title }}</h3>
    <p class="description" v-if="description">{{ description }}</p>
    <div class="action-slot" v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '🏋️‍♂️' },
  title: { type: String, default: 'No Data Found' },
  description: { type: String, default: '' }
});
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);

  .icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  .title {
    font-family: var(--font-heading);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text-main);
    margin-bottom: 0.375rem;
  }

  .description {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    max-width: 360px;
    margin-bottom: 1.25rem;
  }

  .action-slot {
    display: flex;
    justify-content: center;
  }
}
</style>
