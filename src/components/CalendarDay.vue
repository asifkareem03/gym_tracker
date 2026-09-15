<template>
  <div class="calendar-cell" :class="{ 'has-workout': !!workout, 'is-rest': workout?.dayType === 'rest' }">
    <div class="day-number">{{ dayNumber }}</div>

    <div v-if="workout" class="cell-tag-wrapper">
      <span 
        v-if="workout.dayType === 'rest'" 
        class="group-badge rest cell-badge"
      >
        Rest Day
      </span>
      <span 
        v-else 
        class="group-badge cell-badge" 
        :class="workout.groupId || 'custom'"
      >
        {{ groupName }}
      </span>

      <span class="exercise-preview-text" v-if="workout.dayType !== 'rest' && workout.exercises?.length">
        {{ workout.exercises.length }} exercises
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  dateStr: String,
  workout: Object
});

const groupNames = {
  chest_triceps: 'Chest + Triceps',
  back_biceps: 'Back + Biceps',
  shoulders_abs: 'Shoulders + Abs',
  legs: 'Legs',
  full_body: 'Full Body',
  custom: 'Custom'
};

const dayNumber = computed(() => {
  if (!props.dateStr) return '';
  return props.dateStr.split('-')[2].replace(/^0/, '');
});

const groupName = computed(() => {
  if (!props.workout) return '';
  return groupNames[props.workout.groupId] || props.workout.groupId || 'Workout';
});
</script>

<style lang="scss" scoped>
.calendar-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;

  .day-number {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-text-main);
  }

  .cell-tag-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .cell-badge {
      font-size: 0.65rem !important;
      padding: 2px 4px !important;
      border-radius: 4px !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .exercise-preview-text {
      font-size: 0.65rem;
      color: var(--color-text-muted);
    }
  }
}
</style>
