import { defineStore } from 'pinia';
import { workoutService } from '../services/workoutService.js';

export const useWorkoutStore = defineStore('workout', {
  state: () => ({
    workouts: [],
    currentWorkout: null,
    loading: false,
    error: null,
  }),

  getters: {
    workoutMapByDate: (state) => {
      const map = {};
      state.workouts.forEach(w => {
        map[w.workoutDate] = w;
      });
      return map;
    },
    totalWorkoutsCount: (state) => state.workouts.filter(w => w.dayType === 'workout').length,
    recentWorkouts: (state) => state.workouts.slice(0, 7),
  },

  actions: {
    async fetchWorkouts(filters = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await workoutService.getWorkouts(filters);
        const fetched = res.workouts || [];
        if (Object.keys(filters).length === 0) {
          this.workouts = fetched;
        } else {
          const map = new Map();
          this.workouts.forEach(w => map.set(w.workoutDate, w));
          fetched.forEach(w => map.set(w.workoutDate, w));
          const merged = Array.from(map.values());
          merged.sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
          this.workouts = merged;
        }
      } catch (err) {
        this.error = err.message || 'Failed to load workouts';
      } finally {
        this.loading = false;
      }
    },

    async fetchWorkoutById(id) {
      this.loading = true;
      try {
        const res = await workoutService.getWorkoutById(id);
        this.currentWorkout = res.workout;
        return res.workout;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchWorkoutByDate(dateStr) {
      if (!dateStr) return null;
      const found = this.workouts.find(w => w.workoutDate === dateStr);
      if (found) return found;

      try {
        const res = await workoutService.getWorkouts({ from: dateStr, to: dateStr });
        if (res.workouts && res.workouts.length > 0) {
          const loaded = res.workouts[0];
          const idx = this.workouts.findIndex(w => w.workoutDate === dateStr);
          if (idx !== -1) this.workouts[idx] = loaded;
          else this.workouts.push(loaded);
          return loaded;
        }
      } catch (e) {
        console.error('Failed to fetch workout by date:', e);
      }
      return null;
    },

    async saveWorkout(data) {
      this.loading = true;
      try {
        const res = await workoutService.saveWorkout(data);
        const saved = res.workout;
        const index = this.workouts.findIndex(w => w.workoutDate === saved.workoutDate);
        if (index !== -1) {
          this.workouts[index] = saved;
        } else {
          this.workouts.unshift(saved);
          this.workouts.sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
        }
        return saved;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateWorkout(id, data) {
      this.loading = true;
      try {
        const res = await workoutService.updateWorkout(id, data);
        const updated = res.workout;
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
          this.workouts[index] = updated;
        }
        return updated;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteWorkout(id) {
      this.loading = true;
      try {
        await workoutService.deleteWorkout(id);
        this.workouts = this.workouts.filter(w => w.id !== id);
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
