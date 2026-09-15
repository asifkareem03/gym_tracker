import { api } from './api.js';

export const measurementService = {
  async getMeasurements(type) {
    const queryString = type ? `?type=${type}` : '';
    return api.get(`/measurements${queryString}`);
  },

  async saveMeasurement(data) {
    return api.post('/measurements', data);
  },

  async saveInitialSetup(items) {
    return api.post('/measurements', { isInitialSetup: true, items });
  },

  async updateMeasurement(id, data) {
    return api.patch(`/measurements/${id}`, data);
  },

  async deleteMeasurement(id) {
    return api.delete(`/measurements/${id}`);
  }
};
