<template>
  <div class="dashboard-view">
    <!-- Top Header Bar -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="greeting">Good {{ greetingTime }}, {{ authStore.user?.name || 'Athlete' }} 👋</h1>
        <p class="current-date">{{ formattedToday }}</p>
      </div>

      <div class="header-right">
        <router-link to="/workout/new" class="new-workout-btn">
          <el-icon><Plus /></el-icon>
          <span>New Workout</span>
        </router-link>
      </div>
    </header>

    <!-- Stat Metric Cards Grid -->
    <section class="stats-grid">
      <div class="stat-card gym-card">
        <div class="stat-icon bg-emerald">🏋️‍♂️</div>
        <div class="stat-content">
          <span class="stat-num">{{ workoutStore.totalWorkoutsCount }}</span>
          <span class="stat-title">Total Workouts</span>
        </div>
      </div>

      <div class="stat-card gym-card">
        <div class="stat-icon bg-blue">🔥</div>
        <div class="stat-content">
          <span class="stat-num">{{ workoutsThisWeek }}</span>
          <span class="stat-title">Workouts This Week</span>
        </div>
      </div>

      <div class="stat-card gym-card">
        <div class="stat-icon bg-amber">🌿</div>
        <div class="stat-content">
          <span class="stat-num">{{ restDaysThisWeek }}</span>
          <span class="stat-title">Rest Days This Week</span>
        </div>
      </div>

      <div class="stat-card gym-card">
        <div class="stat-icon bg-purple">⚖️</div>
        <div class="stat-content">
          <span class="stat-num">{{ latestWeightStr }}</span>
          <span class="stat-title">Latest Weight</span>
        </div>
      </div>
    </section>

    <!-- Main Section: 7-Day Timeline & Body Metrics Overview -->
    <div class="dashboard-layout">
      <!-- Left Column: Last 7 Days Timeline -->
      <section class="timeline-section gym-card">
        <div class="section-header">
          <h2 class="section-title">Last 7 Days Activity</h2>
          <router-link to="/history" class="view-all-link">View Full History →</router-link>
        </div>

        <div class="timeline-list">
          <div 
            v-for="day in last7Days" 
            :key="day.dateStr" 
            class="timeline-card"
            :class="{ 'is-workout': day.workout?.dayType === 'workout', 'is-rest': day.workout?.dayType === 'rest', 'is-empty': !day.workout }"
          >
            <div class="timeline-left">
              <span class="day-rel-label">{{ day.relativeLabel }}</span>
              <span class="day-date-str">{{ day.formattedDate }}</span>
            </div>

            <div class="timeline-center">
              <template v-if="day.workout">
                <div class="day-status">
                  <span v-if="day.workout.dayType === 'rest'" class="group-badge rest">
                    🌿 Rest Day
                  </span>
                  <span v-else class="group-badge" :class="day.workout.groupId || 'custom'">
                    💪 {{ formatGroupName(day.workout.groupId) }}
                  </span>
                </div>

                <div v-if="day.workout.dayType !== 'rest' && day.workout.exercises?.length" class="ex-preview">
                  {{ day.workout.exercises.map(e => e.exerciseName).slice(0, 3).join(', ') }}
                  <span v-if="day.workout.exercises.length > 3">+{{ day.workout.exercises.length - 3 }} more</span>
                </div>
              </template>

              <template v-else>
                <span class="empty-text">No log recorded</span>
              </template>
            </div>

            <div class="timeline-right">
              <el-button 
                v-if="day.workout" 
                size="small" 
                type="primary" 
                plain 
                @click="editWorkout(day.workout)"
              >
                Edit
              </el-button>
              <el-button 
                v-else 
                size="small" 
                type="success" 
                plain 
                @click="logNewForDate(day.dateStr)"
              >
                <el-icon><Plus /></el-icon>
                <span>Log Day</span>
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column: Body Measurement Overview -->
      <section class="metrics-section gym-card">
        <div class="section-header">
          <h2 class="section-title">Body Measurements</h2>
          <router-link to="/measurements" class="view-all-link">Details →</router-link>
        </div>

        <div class="metrics-overview">
          <!-- Weight Box -->
          <div class="metric-summary-box">
            <div class="box-header">
              <span class="box-title">⚖️ Weight</span>
              <span class="box-current">{{ latestWeightStr }}</span>
            </div>
            <div class="box-details">
              <span>Start: {{ startingWeightStr }}</span>
              <span :class="{ 'text-green': weightDiff < 0, 'text-orange': weightDiff > 0 }">
                Change: {{ formatDiffVal(weightDiff, 'kg') }}
              </span>
            </div>
          </div>

          <!-- Waist Box -->
          <div class="metric-summary-box">
            <div class="box-header">
              <span class="box-title">📏 Waist</span>
              <span class="box-current">{{ latestWaistStr }}</span>
            </div>
            <div class="box-details">
              <span>Start: {{ startingWaistStr }}</span>
              <span :class="{ 'text-green': waistDiff < 0, 'text-orange': waistDiff > 0 }">
                Change: {{ formatDiffVal(waistDiff, 'cm') }}
              </span>
            </div>
          </div>

          <!-- Neck Box -->
          <div class="metric-summary-box">
            <div class="box-header">
              <span class="box-title">👔 Neck</span>
              <span class="box-current">{{ latestNeckStr }}</span>
            </div>
            <div class="box-details">
              <span>Start: {{ startingNeckStr }}</span>
              <span :class="{ 'text-green': neckDiff < 0, 'text-orange': neckDiff > 0 }">
                Change: {{ formatDiffVal(neckDiff, 'cm') }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Weekly Monday Check-in Dialog -->
    <WeeklyCheckinDialog v-model="checkinStore.showDialog" />

    <!-- Edit Day Modal -->
    <WorkoutDayEditor 
      v-model="showEditor" 
      :workout="selectedWorkout" 
      :workout-groups="exerciseStore.groups"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useWorkoutStore } from '../stores/workoutStore.js';
import { useMeasurementStore } from '../stores/measurementStore.js';
import { useCheckinStore } from '../stores/checkinStore.js';
import { useExerciseStore } from '../stores/exerciseStore.js';
import { formatDate, getTodayDateString, getRelativeDayLabel } from '../utils/date.js';
import WeeklyCheckinDialog from '../components/WeeklyCheckinDialog.vue';
import WorkoutDayEditor from '../components/WorkoutDayEditor.vue';
import { Plus } from '@element-plus/icons-vue';

const authStore = useAuthStore();
const workoutStore = useWorkoutStore();
const measurementStore = useMeasurementStore();
const checkinStore = useCheckinStore();
const exerciseStore = useExerciseStore();
const router = useRouter();

const showEditor = ref(false);
const selectedWorkout = ref(null);

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

const greetingTime = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
});

const formattedToday = computed(() => formatDate(getTodayDateString(authStore.userTimezone), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));

const last7Days = computed(() => {
  const list = [];
  const tz = authStore.userTimezone;
  const todayStr = getTodayDateString(tz);
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const workout = workoutStore.workoutMapByDate[dateStr] || null;
    const relativeLabel = getRelativeDayLabel(dateStr, tz);
    const formattedDate = formatDate(dateStr);

    list.push({ dateStr, relativeLabel, formattedDate, workout });
  }

  return list;
});

const workoutsThisWeek = computed(() => {
  return last7Days.value.filter(d => d.workout && d.workout.dayType === 'workout').length;
});

const restDaysThisWeek = computed(() => {
  return last7Days.value.filter(d => d.workout && d.workout.dayType === 'rest').length;
});

// Measurement computed values
const latestWeight = computed(() => measurementStore.latestByType('weight'));
const startingWeight = computed(() => measurementStore.startingByType('weight'));
const latestWeightStr = computed(() => latestWeight.value ? `${latestWeight.value.value} kg` : '—');
const startingWeightStr = computed(() => startingWeight.value ? `${startingWeight.value.value} kg` : '—');
const weightDiff = computed(() => measurementStore.totalChangeByType('weight'));

const latestWaist = computed(() => measurementStore.latestByType('waist'));
const startingWaist = computed(() => measurementStore.startingByType('waist'));
const latestWaistStr = computed(() => latestWaist.value ? `${latestWaist.value.value} cm` : '—');
const startingWaistStr = computed(() => startingWaist.value ? `${startingWaist.value.value} cm` : '—');
const waistDiff = computed(() => measurementStore.totalChangeByType('waist'));

const latestNeck = computed(() => measurementStore.latestByType('neck'));
const startingNeck = computed(() => measurementStore.startingByType('neck'));
const latestNeckStr = computed(() => latestNeck.value ? `${latestNeck.value.value} cm` : '—');
const startingNeckStr = computed(() => startingNeck.value ? `${startingNeck.value.value} cm` : '—');
const neckDiff = computed(() => measurementStore.totalChangeByType('neck'));

function formatDiffVal(diff, unit) {
  if (diff === 0 || !diff) return '0 ' + unit;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff} ${unit}`;
}

function editWorkout(workout) {
  const wId = workout.id || workout._id;
  if (wId) {
    router.push(`/workout/edit/${wId}`);
  } else {
    router.push(`/workout/new?date=${workout.workoutDate}`);
  }
}

function logNewForDate(dateStr) {
  router.push(`/workout/new?date=${dateStr}`);
}

onMounted(async () => {
  await Promise.all([
    workoutStore.fetchWorkouts(),
    measurementStore.fetchMeasurements(),
    exerciseStore.fetchGroups(),
    checkinStore.checkCurrentStatus()
  ]);
});
</script>

<style lang="scss" scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .greeting {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-text-main);
    }

    .current-date {
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
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--color-primary-hover);
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;

        &.bg-emerald { background: #ecfdf5; }
        &.bg-blue { background: #eff6ff; }
        &.bg-amber { background: #fffbeb; }
        &.bg-purple { background: #f3e8ff; }
      }

      .stat-content {
        display: flex;
        flex-direction: column;

        .stat-num {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--color-text-main);
          line-height: 1.2;
        }

        .stat-title {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }
      }
    }
  }

  .dashboard-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;

      .section-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text-main);
      }

      .view-all-link {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-primary);
      }
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .timeline-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: var(--color-bg-app);
        border-radius: var(--radius-md);
        border-left: 4px solid #cbd5e1;

        &.is-workout {
          border-left-color: var(--color-primary);
        }

        &.is-rest {
          border-left-color: #64748b;
        }

        .timeline-left {
          display: flex;
          flex-direction: column;
          width: 120px;

          .day-rel-label {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--color-text-main);
          }

          .day-date-str {
            font-size: 0.75rem;
            color: var(--color-text-muted);
          }
        }

        .timeline-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          .ex-preview {
            font-size: 0.75rem;
            color: var(--color-text-muted);
          }

          .empty-text {
            font-size: 0.85rem;
            color: #94a3b8;
            font-style: italic;
          }
        }
      }
    }

    .metrics-overview {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;

      .metric-summary-box {
        background: var(--color-bg-app);
        border-radius: var(--radius-md);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .box-title {
            font-weight: 700;
            font-size: 0.95rem;
          }

          .box-current {
            font-family: var(--font-heading);
            font-weight: 800;
            font-size: 1.15rem;
            color: var(--color-text-main);
          }
        }

        .box-details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          border-top: 1px dashed var(--color-border);
          padding-top: 0.375rem;

          .text-green { color: #10b981; font-weight: 600; }
          .text-orange { color: #f59e0b; font-weight: 600; }
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .dashboard-view {
    .dashboard-layout {
      grid-template-columns: 1fr;
    }
  }
}
</style>
