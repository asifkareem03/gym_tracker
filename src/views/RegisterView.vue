<template>
  <div class="auth-page">
    <div class="auth-card gym-card">
      <div class="auth-header">
        <div class="logo">🏋️‍♂️</div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Start tracking your workouts & progress today</p>
      </div>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
        style="margin-bottom: 1.25rem;"
      ></el-alert>

      <el-form label-position="top" @submit.prevent="handleRegister" size="large">
        <el-form-item label="Full Name">
          <el-input
            v-model="form.name"
            placeholder="John Doe"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="Email Address">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="Password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="At least 6 characters"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="Confirm Password">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Re-enter password"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="auth-submit-btn"
          :loading="loading"
          native-type="submit"
        >
          Create Account
        </el-button>
      </el-form>

      <div class="auth-footer">
        <span>Already have an account?</span>
        <router-link to="/login" class="auth-link">Sign In</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { User, Message, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref('');

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

async function handleRegister() {
  if (!form.value.name.trim()) {
    error.value = 'Full name is required';
    return;
  }
  if (!form.value.email || !/\S+@\S+\.\S+/.test(form.value.email)) {
    error.value = 'Please enter a valid email address';
    return;
  }
  if (!form.value.password || form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long';
    return;
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      confirmPassword: form.value.confirmPassword
    });

    ElMessage.success('Account created! Welcome aboard 👋');
    router.push({ name: 'setup' });
  } catch (err) {
    error.value = err.message || 'Registration failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  padding: 1.5rem;

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    padding: 2.5rem;
    border-radius: 20px;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;

    .logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .auth-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
    }

    .auth-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
  }

  .auth-submit-btn {
    width: 100%;
    margin-top: 0.5rem;
    height: 48px;
    font-size: 1rem;
    border-radius: 10px;
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.75rem;
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    justify-content: center;
    gap: 0.375rem;

    .auth-link {
      color: #10b981;
      font-weight: 700;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
