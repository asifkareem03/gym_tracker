<template>
  <div class="history-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Workout History</h1>
        <p class="page-subtitle">Filter, search, and review past logs</p>
      </div>

      <router-link to="/workout/new" class="new-workout-btn">
        <el-icon><Plus /></el-icon>
        <span>New Workout</span>
      </router-link>
    </div>

    <!-- Filters Bar -->
    <div class="filters-card gym-card">
      <div class="filters-grid">
        <div class="filter-item">
          <label>Date Range</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="applyFilters"
            style="width: 100%;"
          />
        </div>

        <div class="filter-item">
          <label>Workout Group</label>
          <el-select v-model="filters.groupId" placeholder="All Groups" clearable @change="applyFilters" style="width: 100%;">
            <el-option label="All Groups" value="" />
            <el-option
              v-for="group in exerciseStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <label>Log Type</label>
          <el-select v-model="filters.dayType" placeholder="All Types" clearable @change="applyFilters" style="width: 100%;">
            <el-option label="All Types" value="" />
            <el-option label="💪 Workout Days Only" value="workout" />
            <el-option label="🌿 Rest Days Only" value="rest" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Workout Cards List -->
    <div v-loading="workoutStore.loading">
      <div v-if="workoutStore.workouts.length === 0" class="empty-container">
        <EmptyState
          icon="📋"
          title="No Workout Logs Found"
          description="There are no records matching your selected filter criteria."
        >
          <router-link to="/workout/new" class="new-workout-btn">Log Your First Workout</router-link>
        </EmptyState>
      </div>

      <div v-else class="workout-grid">
        <WorkoutCard
          v-for="workout in workoutStore.workouts"
          :key="workout.id"
          :workout="workout"
          :user-timezone="authStore.userTimezone"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkoutStore } from '../stores/workoutStore.js';
import { useExerciseStore } from '../stores/exerciseStore.js';
import { useAuthStore } from '../stores/authStore.js';
import WorkoutCard from '../components/WorkoutCard.vue';
import EmptyState from '../components/EmptyState.vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const workoutStore = useWorkoutStore();
const exerciseStore = useExerciseStore();
const authStore = useAuthStore();
const router = useRouter();

const dateRange = ref([]);
const filters = ref({
  groupId: '',
  dayType: ''
});

function applyFilters() {
  const query = {};
  if (dateRange.value && dateRange.value.length === 2) {
    query.from = dateRange.value[0];
    query.to = dateRange.value[1];
  }
  if (filters.value.groupId && filters.value.groupId !== 'all') query.groupId = filters.value.groupId;
  if (filters.value.dayType) query.dayType = filters.value.dayType;

  workoutStore.fetchWorkouts(query);
}

function handleEdit(workout) {
  router.push(`/workout/edit/${workout.id}`);
}

async function handleDelete(workoutId) {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this workout record? This cannot be undone.',
      'Delete Record',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );

    await workoutStore.deleteWorkout(workoutId);
    ElMessage.success('Workout record deleted');
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || 'Failed to delete workout');
    }
  }
}

onMounted(() => {
  exerciseStore.fetchGroups();
  workoutStore.fetchWorkouts();
});
</script>

<style lang="scss" scoped>
.history-view {
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

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;

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

  .workout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .empty-container {
    padding: 2rem 0;
  }
}
</style>
