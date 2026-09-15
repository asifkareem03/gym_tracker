import { api } from './api.js';

export const authService = {
  async register({ name, email, password, confirmPassword, timezone }) {
    return api.post('/auth/register', { name, email, password, confirmPassword, timezone });
  },

  async login({ email, password, timezone }) {
    return api.post('/auth/login', { email, password, timezone });
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getMe() {
    return api.get('/auth/me');
  },
};
