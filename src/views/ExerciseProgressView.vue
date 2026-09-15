<template>
  <div class="progress-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Exercise Progress Tracker</h1>
        <p class="page-subtitle">Track weight progression and personal records per exercise</p>
      </div>
    </div>

    <!-- Search / Select Exercise & Filters Bar -->
    <div class="filters-card gym-card">
      <div class="filters-grid">
        <div class="filter-item">
          <label>Workout Group</label>
          <el-select
            v-model="selectedGroup"
            placeholder="Select Workout Group..."
            clearable
            size="large"
            @change="handleGroupChange"
            style="width: 100%;"
          >
            <el-option label="All Groups" value="" />
            <el-option
              v-for="group in exerciseStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </div>

        <div class="filter-item select-exercise-item">
          <label>Select Exercise</label>
          <el-select
            v-model="selectedExercise"
            filterable
            placeholder="Select Exercise..."
            clearable
            style="width: 100%;"
            size="large"
            @change="loadProgress"
          >
            <el-option-group
              v-for="group in groupedExercises"
              :key="group.name"
              :label="group.name"
            >
              <el-option
                v-for="ex in group.exercises"
                :key="ex.name"
                :label="ex.name"
                :value="ex.name"
              />
            </el-option-group>
          </el-select>
        </div>
      </div>
    </div>

    <!-- Main Progress Dashboard when Exercise is Selected -->
    <div v-if="selectedExercise" v-loading="loading">
      <!-- Summary Cards Grid -->
      <section class="stats-grid">
        <div class="stat-card gym-card">
          <div class="stat-icon bg-emerald">🏋️‍♂️</div>
          <div class="stat-content">
            <span class="stat-num">
              {{ stats.latestWeight ? stats.latestWeight + ' kg' + (stats.latestWeightReps ? ' × ' + stats.latestWeightReps + ' reps' : '') : '—' }}
            </span>
            <span class="stat-title">Latest Weight</span>
          </div>
        </div>

        <div class="stat-card gym-card">
          <div class="stat-icon bg-amber">🏆</div>
          <div class="stat-content">
            <span class="stat-num">
              {{ stats.highestWeight ? stats.highestWeight + ' kg' + (stats.highestWeightReps ? ' × ' + stats.highestWeightReps + ' reps' : '') : '—' }}
            </span>
            <span class="stat-title">Personal Record (PR)</span>
          </div>
        </div>

        <div class="stat-card gym-card">
          <div class="stat-icon bg-blue">📊</div>
          <div class="stat-content">
            <span class="stat-num">{{ stats.totalSessions }}</span>
            <span class="stat-title">Total Sessions</span>
          </div>
        </div>

        <div class="stat-card gym-card">
          <div class="stat-icon bg-purple">📅</div>
          <div class="stat-content">
            <span class="stat-num">{{ stats.latestWorkoutDate && stats.latestWorkoutDate !== 'None' ? formatDate(stats.latestWorkoutDate) : '—' }}</span>
            <span class="stat-title">Latest Session Date</span>
          </div>
        </div>
      </section>

      <!-- SVG Progress Trend Line -->
      <div v-if="chartPoints.length > 1" class="chart-card gym-card">
        <h3 class="chart-title">Weight Progression Chart</h3>
        <div class="svg-container">
          <svg viewBox="0 0 500 150" class="progress-svg">
            <!-- Grid Lines -->
            <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" stroke-dasharray="4" />
            <line x1="40" y1="70" x2="480" y2="70" stroke="#e2e8f0" stroke-dasharray="4" />
            <line x1="40" y1="120" x2="480" y2="120" stroke="#e2e8f0" />

            <!-- Polyline -->
            <polyline
              fill="none"
              stroke="#10b981"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              :points="polylinePoints"
            />

            <!-- Data Dots -->
            <g v-for="(pt, idx) in chartPoints" :key="idx">
              <circle
                :cx="pt.x"
                :cy="pt.y"
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                stroke-width="2"
              />
              <text :x="pt.x" :y="pt.y - 10" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">
                {{ pt.weight }}kg
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- History Breakdown Accordion with Innovative Sort Toggle -->
      <div class="history-table-card gym-card">
        <div class="table-header-flex">
          <h3 class="table-card-title">Session Breakdown</h3>
          <div class="sort-toggle-container">
            <span class="sort-toggle-label">Sort Date:</span>
            <el-radio-group v-model="sortOrder" size="small" @change="loadProgress">
              <el-radio-button label="desc">⬇️ Newest First</el-radio-button>
              <el-radio-button label="asc">⬆️ Oldest First</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div v-if="groupedSessionHistory.length === 0" class="empty-msg">
          No recorded sessions for {{ selectedExercise }} yet.
        </div>

        <div v-else class="sessions-list">
          <div 
            v-for="session in groupedSessionHistory" 
            :key="session.key" 
            class="session-row-wrapper"
          >
            <!-- Session Summary Row Header -->
            <div 
              class="session-header-row" 
              @click="toggleSessionExpand(session.key)"
            >
              <div class="session-date-col font-semibold">
                {{ formatDate(session.workoutDate) }}
              </div>

              <div class="session-exercise-col">
                {{ session.exerciseName }}
              </div>

              <div class="session-right-col">
                <span class="group-badge" :class="session.groupId || 'custom'">
                  {{ formatGroupName(session.groupId) }}
                </span>
                <el-icon class="expand-icon">
                  <ArrowDown v-if="expandedSessionKey === session.key" />
                  <ArrowRight v-else />
                </el-icon>
              </div>
            </div>

            <!-- Expandable Sets Details -->
            <div 
              v-show="expandedSessionKey === session.key" 
              class="session-sets-expanded"
            >
              <el-table 
                :data="session.sets" 
                size="medium"
                style="width: 100%; border-radius: 8px;"
              >
                <el-table-column prop="setNumber" label="Set #" width="100" align="center">
                  <template #default="scope">
                    <span class="set-badge">{{ scope.row.setNumber }}</span>
                  </template>
                </el-table-column>

                <el-table-column prop="weightKg" label="Weight (kg)" width="160" align="center">
                  <template #default="scope">
                    <span class="font-bold text-emerald">{{ scope.row.weightKg }} kg</span>
                  </template>
                </el-table-column>

                <el-table-column prop="reps" label="Reps" width="130" align="center">
                  <template #default="scope">
                    <span class="font-bold">{{ scope.row.reps }}</span>
                  </template>
                </el-table-column>

                <el-table-column prop="notes" label="Notes">
                  <template #default="scope">
                    <span class="notes-col">{{ scope.row.notes || '—' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-container">
      <EmptyState
        icon="🔍"
        title="Select an Exercise"
        description="Choose an exercise from the dropdown above to analyze your lift progression and personal records."
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useExerciseStore } from '../stores/exerciseStore.js';
import { workoutService } from '../services/workoutService.js';
import { formatDate } from '../utils/date.js';
import EmptyState from '../components/EmptyState.vue';
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const exerciseStore = useExerciseStore();

const selectedGroup = ref('');
const selectedExercise = ref('');
const sortOrder = ref('desc');
const loading = ref(false);
const expandedSessionKey = ref(null);

const stats = ref({
  latestWeight: 0,
  latestWeightReps: 0,
  highestWeight: 0,
  highestWeightReps: 0,
  totalSessions: 0,
  latestWorkoutDate: ''
});

const history = ref([]);

function toggleSessionExpand(key) {
  if (expandedSessionKey.value === key) {
    expandedSessionKey.value = null;
  } else {
    expandedSessionKey.value = key;
  }
}

const groupedSessionHistory = computed(() => {
  if (!history.value || history.value.length === 0) return [];

  const map = {};
  history.value.forEach(item => {
    const key = `${item.workoutDate}_${item.groupId || ''}_${item.exerciseName}`;
    if (!map[key]) {
      map[key] = {
        key,
        workoutDate: item.workoutDate,
        exerciseName: item.exerciseName,
        groupId: item.groupId,
        sets: []
      };
    }
    map[key].sets.push(item);
  });

  return Object.values(map);
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

const groupedExercises = computed(() => {
  const groups = exerciseStore.groups;
  const exercises = exerciseStore.exercises;

  const activeGroups = selectedGroup.value 
    ? groups.filter(g => g.id === selectedGroup.value)
    : groups;

  return activeGroups.map(g => {
    const groupExs = exercises.filter(e => e.groupId === g.id);
    return {
      name: g.name,
      exercises: groupExs
    };
  }).filter(g => g.exercises.length > 0);
});

function handleGroupChange() {
  selectedExercise.value = '';
  stats.value = { latestWeight: 0, latestWeightReps: 0, highestWeight: 0, highestWeightReps: 0, totalSessions: 0, latestWorkoutDate: '' };
  history.value = [];
}

async function loadProgress() {
  if (!selectedExercise.value) {
    stats.value = { latestWeight: 0, latestWeightReps: 0, highestWeight: 0, highestWeightReps: 0, totalSessions: 0, latestWorkoutDate: '' };
    history.value = [];
    return;
  }
  loading.value = true;

  try {
    const res = await workoutService.getExerciseProgress(selectedExercise.value, {
      sort: sortOrder.value
    });

    stats.value = res.stats || { latestWeight: 0, latestWeightReps: 0, highestWeight: 0, highestWeightReps: 0, totalSessions: 0, latestWorkoutDate: '' };
    history.value = res.history || [];
  } catch (err) {
    ElMessage.error(err.message || 'Failed to load exercise progress');
  } finally {
    loading.value = false;
  }
}

const chartPoints = computed(() => {
  if (!history.value || history.value.length === 0) return [];

  // Group by date & pick max weight per session
  const dateMap = {};
  history.value.forEach(item => {
    const d = item.workoutDate;
    if (!dateMap[d] || item.weightKg > dateMap[d]) {
      dateMap[d] = item.weightKg;
    }
  });

  const sortedDates = Object.keys(dateMap).sort();
  if (sortedDates.length === 0) return [];

  const weights = sortedDates.map(d => dateMap[d]);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rangeW = maxW - minW || 1;

  const width = 440;
  const height = 100;
  const startX = 40;
  const startY = 120;

  return sortedDates.map((date, idx) => {
    const x = sortedDates.length === 1 ? width / 2 + startX : startX + (idx / (sortedDates.length - 1)) * width;
    const norm = (dateMap[date] - minW) / rangeW;
    const y = startY - norm * (height - 20);

    return {
      date,
      weight: dateMap[date],
      x,
      y
    };
  });
});

const polylinePoints = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

onMounted(async () => {
  await exerciseStore.fetchGroups();
  await exerciseStore.fetchExercises();
});
</script>

<style lang="scss" scoped>
.progress-view {
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
  }

  .filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;

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
          font-size: 1.4rem;
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

  .chart-card {
    margin-bottom: 1.5rem;

    .chart-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .svg-container {
      width: 100%;
      overflow-x: auto;

      .progress-svg {
        width: 100%;
        height: auto;
        max-height: 200px;
      }
    }
  }

  .history-table-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .table-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;

      .table-card-title {
        font-size: 1.1rem;
        font-weight: 700;
      }

      .sort-toggle-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .sort-toggle-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
      }
    }

    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .session-row-wrapper {
        border: 1px solid var(--color-border);
        border-radius: 10px;
        overflow: hidden;
        background: #ffffff;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .session-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          background: #f8fafc;
          cursor: pointer;
          user-select: none;
          gap: 1rem;

          .session-date-col {
            font-size: 0.95rem;
            color: var(--color-text-main);
            min-width: 110px;
            text-align: left;
          }

          .session-exercise-col {
            font-weight: 700;
            font-size: 1rem;
            color: var(--color-text-main);
            flex: 1;
            text-align: center;
          }

          .session-right-col {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 130px;
            justify-content: flex-end;

            .expand-icon {
              font-size: 1rem;
              color: var(--color-text-muted);
            }
          }
        }

        .session-sets-expanded {
          padding: 1rem 1.25rem;
          background: #ffffff;
          border-top: 1px solid var(--color-border-subtle);

          .sets-subtable {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;

            th {
              text-align: left;
              padding: 0.5rem 0.75rem;
              font-weight: 600;
              color: var(--color-text-muted);
              border-bottom: 1px solid var(--color-border);
            }

            td {
              padding: 0.625rem 0.75rem;
              border-bottom: 1px dashed var(--color-border-subtle);
            }
          }
        }
      }
    }
  }

  .set-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #f1f5f9;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.75rem;
  }

  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .text-emerald { color: #10b981; }

  .empty-msg {
    color: var(--color-text-muted);
    padding: 2rem 0;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .progress-view {
    .filters-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
