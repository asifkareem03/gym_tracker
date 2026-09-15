import { api } from './api.js';

export const exerciseService = {
  async getWorkoutGroups() {
    return api.get('/workout-groups');
  },

  async getExercises(groupId) {
    const queryString = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
    return api.get(`/exercises${queryString}`);
  },

  async createExercise({ name, groupId, subGroup }) {
    return api.post('/exercises', { name, groupId, subGroup });
  }
};
