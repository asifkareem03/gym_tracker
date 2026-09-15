<template>
  <div class="calendar-cell" :class="{ 'has-workout': !!workout, 'is-rest': workout?.dayType === 'rest' }">
    <div class="day-number">{{ dayNumber }}</div>

    <div v-if="workout" class="cell-tag-wrapper">
      <!-- Mobile Dot Color Indicator -->
      <div 
        class="mobile-workout-dot"
        :class="workout.dayType === 'rest' ? 'rest' : (workout.groupId || 'custom')"
        :title="workout.dayType === 'rest' ? 'Rest Day' : groupName"
      ></div>

      <!-- Desktop Text Badges -->
      <div class="desktop-badges">
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
    width: 100%;

    .mobile-workout-dot {
      display: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin: 2px auto 0 auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);

      &.chest_triceps { background-color: var(--group-chest, #10b981); }
      &.back_biceps { background-color: var(--group-back, #3b82f6); }
      &.shoulders_abs { background-color: var(--group-shoulders, #f59e0b); }
      &.legs { background-color: var(--group-legs, #8b5cf6); }
      &.full_body { background-color: var(--group-fullbody, #06b6d4); }
      &.rest { background-color: var(--group-rest, #64748b); }
      &.custom { background-color: #6b7280; }
    }

    .desktop-badges {
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
}

@media (max-width: 768px) {
  .calendar-cell {
    padding: 2px;
    justify-content: center;
    align-items: center;

    .day-number {
      font-size: 0.8rem;
    }

    .cell-tag-wrapper {
      .mobile-workout-dot {
        display: block;
      }

      .desktop-badges {
        display: none;
      }
    }
  }
}
</style>
