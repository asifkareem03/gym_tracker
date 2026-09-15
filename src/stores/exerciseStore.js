import { defineStore } from 'pinia';
import { exerciseService } from '../services/exerciseService.js';

export const useExerciseStore = defineStore('exercise', {
  state: () => ({
    groups: [],
    exercises: [],
    loading: false,
    error: null,
  }),

  getters: {
    groupsMap: (state) => {
      const map = {};
      state.groups.forEach(g => {
        map[g.id] = g;
      });
      return map;
    },
  },

  actions: {
    async fetchGroups() {
      if (this.groups.length > 0) return;
      try {
        const res = await exerciseService.getWorkoutGroups();
        this.groups = res.groups || [];
      } catch (err) {
        console.error('Failed to fetch groups:', err);
      }
    },

    async fetchExercises(groupId) {
      this.loading = true;
      try {
        const res = await exerciseService.getExercises(groupId);
        this.exercises = res.exercises || [];
        return this.exercises;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
