import { api } from './api.js';

export const workoutService = {
  async getWorkouts({ from, to, groupId, dayType } = {}) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (groupId) params.append('groupId', groupId);
    if (dayType) params.append('dayType', dayType);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/workouts${queryString}`);
  },

  async getWorkoutById(id) {
    return api.get(`/workouts/${id}`);
  },

  async saveWorkout(workoutData) {
    return api.post('/workouts', workoutData);
  },

  async updateWorkout(id, workoutData) {
    return api.patch(`/workouts/${id}`, workoutData);
  },

  async deleteWorkout(id) {
    return api.delete(`/workouts/${id}`);
  },

  async getExerciseProgress(exerciseId, { from, to, groupId, sort } = {}) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (groupId) params.append('groupId', groupId);
    if (sort) params.append('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/progress/exercise/${encodeURIComponent(exerciseId)}${queryString}`);
  }
};
