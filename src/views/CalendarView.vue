<template>
  <div class="calendar-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Workout Calendar</h1>
        <p class="page-subtitle">View and manage your workouts by date</p>
      </div>

      <router-link to="/workout/new" class="new-workout-btn">
        <el-icon><Plus /></el-icon>
        <span>New Workout</span>
      </router-link>
    </div>

    <!-- Calendar Container -->
    <div class="calendar-card gym-card" v-loading="workoutStore.loading">
      <el-calendar v-model="selectedCalendarDate">
        <template #date-cell="{ data }">
          <div 
            class="cell-wrapper"
            :class="getCellClass(data.day)"
            @click="handleDateClick(data.day)"
          >
            <CalendarDay 
              :date-str="data.day" 
              :workout="workoutStore.workoutMapByDate[data.day]"
            />
          </div>
        </template>
      </el-calendar>
    </div>

    <!-- Day Details Dialog -->
    <el-dialog 
      v-model="showDetailsModal" 
      title="Day Details" 
      width="480px"
    >
      <div v-if="selectedDateStr" class="day-details-content">
        <p><strong>Date:</strong> {{ formatDate(selectedDateStr) }}</p>

        <div v-if="activeDayWorkout" class="detail-section">
          <p class="type-row">
            <strong>Type:</strong> 
            <span v-if="activeDayWorkout.dayType === 'rest'" class="group-badge rest">Rest Day</span>
            <span v-else class="group-badge" :class="activeDayWorkout.groupId || 'custom'">
              {{ formatGroupName(activeDayWorkout.groupId) }}
            </span>
          </p>

          <p v-if="activeDayWorkout.notes" class="day-notes">
            <strong>Notes:</strong> {{ activeDayWorkout.notes }}
          </p>

          <div v-if="activeDayWorkout.dayType !== 'rest' && activeDayWorkout.exercises?.length" class="exercises-detail-list">
            <h4 class="detail-subtitle">Exercises & Sets</h4>
            <div v-for="ex in activeDayWorkout.exercises" :key="ex.exerciseName" class="ex-detail-item">
              <div class="ex-detail-name">{{ ex.exerciseName }}</div>
              <div class="sets-chips">
                <span v-for="set in ex.sets || []" :key="set.setNumber" class="set-chip">
                  Set {{ set.setNumber }}: {{ set.weightKg }}kg × {{ set.reps }} reps
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="detail-section">
          <p class="text-muted">No workout or rest day logged for this date yet.</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="activeDayWorkout">
            <el-button type="primary" @click="goToEdit(activeDayWorkout)">
              Edit Log
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" :icon="Plus" @click="goToNewForDate(selectedDateStr)">
              <span>Add Workout / Rest Day</span>
            </el-button>
          </template>
          <el-button @click="showDetailsModal = false">Close</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkoutStore } from '../stores/workoutStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { formatDate } from '../utils/date.js';
import CalendarDay from '../components/CalendarDay.vue';
import { Plus } from '@element-plus/icons-vue';

const workoutStore = useWorkoutStore();
const authStore = useAuthStore();
const router = useRouter();

const selectedCalendarDate = ref(new Date());
const selectedDateStr = ref('');
const showDetailsModal = ref(false);

const activeDayWorkout = computed(() => {
  if (!selectedDateStr.value) return null;
  return workoutStore.workoutMapByDate[selectedDateStr.value] || null;
});

const groupNames = {
  chest_triceps: 'Chest + Triceps',
  back_biceps: 'Back + Biceps',
  shoulders_abs: 'Shoulders + Abs',
  legs: 'Legs',
  full_body: 'Full Body',
  custom: 'Custom'
};

function formatGroupName(id) {
  return groupNames[id] || id || 'Workout';
}

function getCellClass(dayStr) {
  const w = workoutStore.workoutMapByDate[dayStr];
  if (!w) return '';
  return w.dayType === 'rest' ? 'has-rest' : 'has-workout';
}

function handleDateClick(dayStr) {
  selectedDateStr.value = dayStr;
  showDetailsModal.value = true;
}

function goToEdit(workout) {
  showDetailsModal.value = false;
  router.push(`/workout/edit/${workout._id || workout.id}`);
}

function goToNewForDate(dayStr) {
  showDetailsModal.value = false;
  router.push(`/workout/new?date=${dayStr}`);
}

watch(selectedCalendarDate, (newDate) => {
  if (!newDate) return;
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const from = `${year}-${month}-01`;
  const lastDay = new Date(year, newDate.getMonth() + 1, 0).getDate();
  const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  workoutStore.fetchWorkouts({ from, to });
});

onMounted(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const from = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  workoutStore.fetchWorkouts({ from, to });
});
</script>

<style lang="scss" scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-text-main);
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }

    .new-workout-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--color-primary);
      color: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.95rem;
    }
  }

  .calendar-card {
    padding: 1rem;
  }

  .cell-wrapper {
    height: 100%;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.15s ease;

    &:hover {
      background: #f1f5f9;
    }

    &.has-workout {
      background: #ecfdf5;
    }

    &.has-rest {
      background: #f8fafc;
    }
  }

  .day-details-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .type-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .day-notes {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;
    }

    .detail-subtitle {
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .ex-detail-item {
      margin-bottom: 0.75rem;
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 8px;

      .ex-detail-name {
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 0.375rem;
      }

      .sets-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;

        .set-chip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #475569;
        }
      }
    }
  }

  .empty-msg {
    color: var(--color-text-muted);
    text-align: center;
    padding: 1.5rem 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}
</style>
