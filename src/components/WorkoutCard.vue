<template>
  <div class="workout-card gym-card" :class="{ 'is-rest': workout.dayType === 'rest' }">
    <div class="card-header">
      <div class="date-badge">
        <span class="day-label">{{ relativeLabel }}</span>
        <span class="full-date">{{ formattedDate }}</span>
      </div>

      <div class="type-tag">
        <span v-if="workout.dayType === 'rest'" class="group-badge rest">
          🌿 Rest Day
        </span>
        <span v-else class="group-badge" :class="workout.groupId || 'custom'">
          💪 {{ groupName }}
        </span>
      </div>
    </div>

    <!-- Rest Day Content -->
    <div v-if="workout.dayType === 'rest'" class="rest-content">
      <p class="rest-notes">{{ workout.notes || 'Rest and recovery day.' }}</p>
    </div>

    <!-- Workout Day Exercises Summary -->
    <div v-else class="workout-content">
      <div class="exercise-summary-list">
        <div 
          v-for="group in groupedCardExercises" 
          :key="group.label" 
          class="card-subgroup-section"
        >
          <div class="card-subgroup-title">{{ group.label }}</div>
          <div 
            v-for="ex in group.items" 
            :key="ex.exerciseId || ex.exerciseName" 
            class="exercise-item-wrapper"
          >
            <div 
              class="exercise-row" 
              @click="toggleExpand(ex.exerciseId || ex.exerciseName)"
            >
              <div class="ex-left">
                <el-icon class="expand-icon">
                  <ArrowDown v-if="expandedExKey === (ex.exerciseId || ex.exerciseName)" />
                  <ArrowRight v-else />
                </el-icon>
                <span class="exercise-name">{{ ex.exerciseName }}</span>
              </div>
              <span class="sets-count">{{ ex.sets ? ex.sets.length : 0 }} sets</span>
            </div>

            <!-- Collapsible Sets Details List (One expandable at a time) -->
            <div 
              v-show="expandedExKey === (ex.exerciseId || ex.exerciseName)" 
              class="exercise-sets-detail"
            >
              <div 
                v-for="(set, sIdx) in (ex.sets || [])" 
                :key="sIdx" 
                class="set-detail-row"
              >
                <span class="set-num-label">Set {{ sIdx + 1 }}:</span>
                <span class="set-specs"><strong>{{ set.weightKg || 0 }} kg</strong> × {{ set.reps || 0 }} reps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="workout.notes" class="workout-notes">
        📝 {{ workout.notes }}
      </p>
    </div>

    <!-- Footer Actions -->
    <div class="card-actions">
      <el-button size="small" type="primary" plain @click="$emit('edit', workout)">
        <el-icon><Edit /></el-icon> Edit
      </el-button>
      <el-button size="small" type="danger" plain @click="$emit('delete', workout.id)">
        <el-icon><Delete /></el-icon> Delete
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDate, getRelativeDayLabel } from '../utils/date.js';
import { Edit, Delete, ArrowRight, ArrowDown } from '@element-plus/icons-vue';
import { useExerciseStore } from '../stores/exerciseStore.js';

const props = defineProps({
  workout: {
    type: Object,
    required: true
  },
  userTimezone: {
    type: String,
    default: 'UTC'
  }
});

defineEmits(['edit', 'delete']);

const exerciseStore = useExerciseStore();
const expandedExKey = ref(null);

function toggleExpand(key) {
  if (expandedExKey.value === key) {
    expandedExKey.value = null;
  } else {
    expandedExKey.value = key;
  }
}

const groupNames = {
  all: 'All Groups',
  chest_triceps: 'Chest + Triceps',
  back_biceps: 'Back + Biceps',
  shoulders_abs: 'Shoulders + Abs',
  legs: 'Legs',
  full_body: 'Full Body',
  custom: 'Custom'
};

const groupName = computed(() => groupNames[props.workout.groupId] || props.workout.groupId || 'Workout');
const formattedDate = computed(() => formatDate(props.workout.workoutDate));
const relativeLabel = computed(() => getRelativeDayLabel(props.workout.workoutDate, props.userTimezone));

function getSubGroupLabel(ex) {
  if (ex.subGroup && ex.subGroup !== 'Custom') return ex.subGroup;

  const storeEx = exerciseStore.exercises.find(
    e => e.name.toLowerCase() === (ex.exerciseName || ex.name || '').toLowerCase()
  );
  if (storeEx && storeEx.subGroup) return storeEx.subGroup;

  const name = (ex.exerciseName || ex.name || '').toLowerCase();
  const gid = props.workout.groupId;

  if (gid === 'chest_triceps') {
    if (name.includes('triceps') || name.includes('pushdown') || name.includes('extension') || name.includes('crusher') || name.includes('dips')) return 'Triceps';
    return 'Chest';
  }
  if (gid === 'back_biceps') {
    if (name.includes('curl') || name.includes('biceps') || name.includes('preacher') || name.includes('hammer')) return 'Biceps';
    return 'Back';
  }
  if (gid === 'shoulders_abs') {
    if (name.includes('plank') || name.includes('crunch') || name.includes('abs') || (name.includes('raise') && name.includes('leg')) || name.includes('twist')) return 'Abs';
    return 'Shoulders';
  }
  if (gid === 'legs') return 'Legs';

  if (name.includes('face pull') || name.includes('shoulder') || name.includes('lateral') || name.includes('delt') || name.includes('shrug') || name.includes('arnold')) return 'Shoulders';
  if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('push up')) return 'Chest';
  if (name.includes('tricep') || name.includes('dips')) return 'Triceps';
  if (name.includes('row') || name.includes('pulldown') || name.includes('pull up') || name.includes('lats') || (name.includes('deadlift') && !name.includes('romanian'))) return 'Back';
  if (name.includes('bicep') || name.includes('curl')) return 'Biceps';
  if (name.includes('squat') || name.includes('press') || name.includes('lunge') || name.includes('calf') || name.includes('leg')) return 'Legs';
  if (name.includes('plank') || name.includes('crunch')) return 'Abs';

  return 'Chest';
}

const groupedCardExercises = computed(() => {
  const map = {};
  (props.workout.exercises || []).forEach(ex => {
    const label = getSubGroupLabel(ex);
    if (!map[label]) {
      map[label] = [];
    }
    map[label].push(ex);
  });

  const preferredOrder = ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Abs', 'Legs'];
  const result = [];

  preferredOrder.forEach(label => {
    if (map[label] && map[label].length > 0) {
      result.push({ label, items: map[label] });
    }
  });

  Object.keys(map).forEach(label => {
    if (!preferredOrder.includes(label) && map[label].length > 0) {
      result.push({ label, items: map[label] });
    }
  });

  return result;
});
</script>

<style lang="scss" scoped>
.workout-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 350px;
  box-sizing: border-box;

  &.is-rest {
    border-left: 4px solid var(--color-text-muted);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: nowrap;
    flex-shrink: 0;

    .date-badge {
      display: flex;
      flex-direction: column;

      .day-label {
        font-weight: 800;
        font-size: 1.1rem;
        color: var(--color-text-main);
        line-height: 1.2;
      }

      .full-date {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
    }
  }

  .rest-content {
    flex: 1;
    min-height: 0;
    padding: 0.5rem 0;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .workout-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .exercise-summary-list {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      overflow-y: auto;
      padding-right: 0.375rem;

      &::-webkit-scrollbar {
        width: 5px;
      }
      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      .card-subgroup-section {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;

        .card-subgroup-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-left: 0.25rem;
        }
      }

      .exercise-item-wrapper {
        display: flex;
        flex-direction: column;
        border: 1px solid #f1f5f9;
        border-radius: 8px;
        overflow: hidden;
        background: var(--color-bg-app);

        .exercise-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          padding: 0.4rem 0.625rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease;

          &:hover {
            background: #f1f5f9;
          }

          .ex-left {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .expand-icon {
              font-size: 0.85rem;
              color: var(--color-text-muted);
            }

            .exercise-name {
              font-weight: 600;
              color: var(--color-text-main);
            }
          }

          .sets-count {
            font-size: 0.75rem;
            font-weight: 600;
            color: #475569;
            background: #ffffff;
            padding: 2px 8px;
            border-radius: 9999px;
            border: 1px solid #e2e8f0;
          }
        }

        .exercise-sets-detail {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem 0.625rem 2rem;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;

          .set-detail-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.8rem;
            color: var(--color-text-main);

            .set-num-label {
              font-weight: 700;
              color: var(--color-text-muted);
              min-width: 45px;
            }

            .set-specs {
              font-weight: 500;

              strong {
                color: var(--color-primary-dark);
                font-weight: 700;
              }
            }
          }
        }
      }
    }

    .workout-notes {
      flex-shrink: 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      background: #fffbe0;
      padding: 0.4rem 0.5rem;
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-subtle);
    flex-shrink: 0;
  }
}
</style>
