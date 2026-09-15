import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import InitialSetupView from '../views/InitialSetupView.vue';
import DashboardView from '../views/DashboardView.vue';
import CalendarView from '../views/CalendarView.vue';
import WorkoutHistoryView from '../views/WorkoutHistoryView.vue';
import ExerciseProgressView from '../views/ExerciseProgressView.vue';
import BodyMeasurementsView from '../views/BodyMeasurementsView.vue';
import NewWorkoutView from '../views/NewWorkoutView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true }
  },
  {
    path: '/setup',
    name: 'setup',
    component: InitialSetupView,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarView,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'workout-history',
    component: WorkoutHistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/progress',
    name: 'exercise-progress',
    component: ExerciseProgressView,
    meta: { requiresAuth: true }
  },
  {
    path: '/measurements',
    name: 'body-measurements',
    component: BodyMeasurementsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/workout/new',
    name: 'new-workout',
    component: NewWorkoutView,
    meta: { requiresAuth: true }
  },
  {
    path: '/workout/edit/:id',
    name: 'edit-workout',
    component: NewWorkoutView,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    await authStore.fetchCurrentUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  // Redirect to setup if first login and initial setup is incomplete
  if (authStore.isAuthenticated && !authStore.hasCompletedSetup && to.name !== 'setup') {
    return next({ name: 'setup' });
  }

  next();
});

export default router;
