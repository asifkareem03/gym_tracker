import { defineStore } from 'pinia';
import { measurementService } from '../services/measurementService.js';

export const useMeasurementStore = defineStore('measurement', {
  state: () => ({
    measurements: [],
    loading: false,
    error: null,
  }),

  getters: {
    byType: (state) => (type) => {
      return state.measurements
        .filter(m => m.type === type)
        .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
    },

    latestByType: (state) => (type) => {
      const filtered = state.measurements
        .filter(m => m.type === type)
        .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate));
      return filtered.length > 0 ? filtered[0] : null;
    },

    startingByType: (state) => (type) => {
      const filtered = state.measurements
        .filter(m => m.type === type)
        .sort((a, b) => a.measurementDate.localeCompare(b.measurementDate));
      const initial = filtered.find(m => m.isInitial);
      return initial || (filtered.length > 0 ? filtered[0] : null);
    },

    totalChangeByType: (state) => (type) => {
      const latest = state.measurements
        .filter(m => m.type === type)
        .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate))[0];

      const starting = state.measurements
        .filter(m => m.type === type)
        .sort((a, b) => a.measurementDate.localeCompare(b.measurementDate))[0];

      if (!latest || !starting) return 0;
      return Number((latest.value - starting.value).toFixed(1));
    }
  },

  actions: {
    async fetchMeasurements(type) {
      this.loading = true;
      try {
        const res = await measurementService.getMeasurements(type);
        if (type) {
          // Replace matching type
          this.measurements = [
            ...this.measurements.filter(m => m.type !== type),
            ...(res.measurements || [])
          ];
        } else {
          this.measurements = res.measurements || [];
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async saveMeasurement(data) {
      this.loading = true;
      try {
        const res = await measurementService.saveMeasurement(data);
        await this.fetchMeasurements();
        return res;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async saveInitialSetup(items) {
      this.loading = true;
      try {
        const res = await measurementService.saveInitialSetup(items);
        await this.fetchMeasurements();
        return res;
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateMeasurement(id, data) {
      this.loading = true;
      try {
        await measurementService.updateMeasurement(id, data);
        await this.fetchMeasurements();
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteMeasurement(id) {
      this.loading = true;
      try {
        await measurementService.deleteMeasurement(id);
        this.measurements = this.measurements.filter(m => m.id !== id);
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
