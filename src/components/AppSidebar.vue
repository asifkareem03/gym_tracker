<template>
  <aside class="sidebar" :class="{ 'mobile-open': isOpen }">
    <div class="sidebar-header">
      <div class="brand">
        <div class="logo-icon">🏋️‍♂️</div>
        <span class="brand-title">GymTracker</span>
      </div>
      <button class="close-mobile-btn" @click="$emit('close-mobile')">✕</button>
    </div>

    <!-- Navigation Links -->
    <nav class="nav-menu">
      <router-link to="/" class="nav-item" exact-active-class="active" @click="$emit('close-mobile')">
        <el-icon><DataLine /></el-icon>
        <span>Dashboard</span>
      </router-link>

      <router-link to="/calendar" class="nav-item" active-class="active" @click="$emit('close-mobile')">
        <el-icon><Calendar /></el-icon>
        <span>Calendar</span>
      </router-link>

      <router-link to="/history" class="nav-item" active-class="active" @click="$emit('close-mobile')">
        <el-icon><List /></el-icon>
        <span>Workout History</span>
      </router-link>

      <router-link to="/progress" class="nav-item" active-class="active" @click="$emit('close-mobile')">
        <el-icon><TrendCharts /></el-icon>
        <span>Exercise Progress</span>
      </router-link>

      <router-link to="/measurements" class="nav-item" active-class="active" @click="$emit('close-mobile')">
        <el-icon><ScaleToOriginal /></el-icon>
        <span>Body Measurements</span>
      </router-link>
    </nav>

    <!-- Quick Action -->
    <div class="quick-action">
      <router-link to="/workout/new" class="new-workout-btn" @click="$emit('close-mobile')">
        <el-icon><Plus /></el-icon>
        <span>New Workout</span>
      </router-link>
    </div>

    <!-- Recent 7 Days Quick Preview Widget -->
    <div class="recent-days-widget" v-if="recentDays.length > 0">
      <div class="widget-title">Last 7 Days Activity</div>
      <div class="days-list">
        <div 
          v-for="day in recentDays" 
          :key="day.dateStr" 
          class="day-item"
          @click="handleDayClick(day)"
        >
          <span class="day-date">{{ day.label }}</span>
          <span :class="['group-badge', day.workout ? (day.workout.dayType === 'rest' ? 'rest' : day.workout.groupId || 'custom') : 'none']">
            {{ day.workout ? (day.workout.dayType === 'rest' ? 'Rest Day' : formatGroupName(day.workout.groupId)) : 'Empty' }}
          </span>
        </div>
      </div>
    </div>

    <!-- User Profile Section -->
    <div class="sidebar-footer">
      <UserProfile :user="authStore.user" :totalWorkouts="workoutStore.totalWorkoutsCount" />
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useWorkoutStore } from '../stores/workoutStore.js';
import UserProfile from './UserProfile.vue';
import { DataLine, Calendar, List, TrendCharts, ScaleToOriginal, Plus } from '@element-plus/icons-vue';
import { getTodayDateString, getRelativeDayLabel } from '../utils/date.js';

defineProps({
  isOpen: Boolean
});

defineEmits(['close-mobile', 'select-day']);

const authStore = useAuthStore();
const workoutStore = useWorkoutStore();
const router = useRouter();

onMounted(() => {
  if (authStore.isAuthenticated) {
    workoutStore.fetchWorkouts();
  }
});

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      workoutStore.fetchWorkouts();
    }
  },
  { immediate: true }
);

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

const recentDays = computed(() => {
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
    const label = getRelativeDayLabel(dateStr, tz);

    list.push({ dateStr, label, workout });
  }

  return list;
});

function handleDayClick(day) {
  if (day.workout) {
    const wId = day.workout.id || day.workout._id;
    if (wId) {
      router.push(`/workout/edit/${wId}`);
    } else {
      router.push(`/workout/new?date=${day.dateStr}`);
    }
  } else {
    router.push(`/workout/new?date=${day.dateStr}`);
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 280px;
  background-color: var(--color-bg-sidebar);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  border-right: 1px solid #1e293b;
  overflow-y: auto;
  transition: transform 0.3s ease;

  .sidebar-header {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1e293b;

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .logo-icon {
        font-size: 1.5rem;
      }

      .brand-title {
        font-family: var(--font-heading);
        font-size: 1.25rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.02em;
      }
    }

    .close-mobile-btn {
      display: none;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
    }
  }

  .nav-menu {
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-bg-sidebar-active);
        color: #ffffff;
      }

      &.active {
        background-color: #2563eb;
        color: #ffffff;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
    }
  }

  .quick-action {
    padding: 0 0.75rem 1rem;

    .new-workout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background-color: #10b981;
      color: #ffffff;
      padding: 0.75rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #059669;
      }
    }
  }

  .recent-days-widget {
    margin: 0.5rem 0.5rem;
    background: #1e293b;
    border-radius: 10px;
    padding: 0.5rem;

    .widget-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .days-list {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      .day-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.75rem;
        padding: 0.3rem 0.3rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #334155;
        }

        .day-date {
          color: #cbd5e1;
          font-weight: 500;
          white-space: nowrap;
          flex: 1;
        }

        .group-badge {
          white-space: nowrap;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          width: 125px;
          box-sizing: border-box;
          justify-content: center;
          text-align: center;
          flex-shrink: 0;

          &.none {
            background-color: #475569;
            opacity: 0.7;
          }
        }
      }
    }
  }

  .sidebar-footer {
    margin-top: auto;
    padding: 0.75rem;
  }
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);

    &.mobile-open {
      transform: translateX(0);
    }

    .sidebar-header {
      .close-mobile-btn {
        display: block;
      }
    }
  }
}
</style>
