import { defineStore } from 'pinia';
import { authService } from '../services/authService.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    initialized: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    hasCompletedSetup: (state) => state.user ? !!state.user.hasCompletedInitialSetup : true,
    userTimezone: (state) => state.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },

  actions: {
    async fetchCurrentUser() {
      this.loading = true;
      this.error = null;
      try {
        const res = await authService.getMe();
        this.user = res.user;
      } catch (err) {
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },

    async register(payload) {
      this.loading = true;
      this.error = null;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const res = await authService.register({ ...payload, timezone: tz });
        this.user = res.user;
        return res;
      } catch (err) {
        this.error = err.message || 'Registration failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async login(payload) {
      this.loading = true;
      this.error = null;
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const res = await authService.login({ ...payload, timezone: tz });
        this.user = res.user;
        return res;
      } catch (err) {
        this.error = err.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      try {
        await authService.logout();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        this.user = null;
        this.loading = false;
        try {
          const { useWorkoutStore } = await import('./workoutStore.js');
          const workoutStore = useWorkoutStore();
          workoutStore.workouts = [];
        } catch (e) {}
      }
    },

    markSetupComplete() {
      if (this.user) {
        this.user.hasCompletedInitialSetup = true;
      }
    }
  }
});
