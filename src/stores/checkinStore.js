import { defineStore } from 'pinia';
import { checkinService } from '../services/checkinService.js';

export const useCheckinStore = defineStore('checkin', {
  state: () => ({
    isMonday: false,
    weekKey: null,
    isCompleted: true,
    showDialog: false,
    history: [],
    loading: false,
  }),

  actions: {
    async checkCurrentStatus() {
      try {
        const res = await checkinService.getCurrentCheckinStatus();
        this.isMonday = res.isMonday;
        this.weekKey = res.weekKey;
        this.isCompleted = res.isCompleted;

        // If today is Monday and not yet completed, show dialog automatically
        if (this.isMonday && !this.isCompleted) {
          this.showDialog = true;
        }
      } catch (err) {
        console.error('Checkin status check failed:', err);
      }
    },

    async submitCheckin(data) {
      this.loading = true;
      try {
        const res = await checkinService.submitWeeklyCheckin(data);
        this.isCompleted = true;
        this.showDialog = false;
        return res;
      } catch (err) {
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchHistory() {
      try {
        const res = await checkinService.getCheckinHistory();
        this.history = res.checkins || [];
      } catch (err) {
        console.error('Checkin history failed:', err);
      }
    },

    dismissDialog() {
      this.showDialog = false;
    }
  }
});
