import { api } from './api.js';

export const checkinService = {
  async getCurrentCheckinStatus() {
    return api.get('/checkins/current');
  },

  async submitWeeklyCheckin({ weight, waist, neck, notes }) {
    return api.post('/checkins', { weight, waist, neck, notes });
  },

  async getCheckinHistory() {
    return api.get('/checkins/history');
  }
};
