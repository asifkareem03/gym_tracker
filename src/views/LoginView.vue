<template>
  <div class="auth-page">
    <div class="auth-card gym-card">
      <div class="auth-header">
        <div class="logo">🏋️‍♂️</div>
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your GymTracker account</p>
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

      <el-form label-position="top" @submit.prevent="handleLogin" size="large">
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
            placeholder="••••••••"
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
          Sign In
        </el-button>
      </el-form>

      <div class="auth-footer">
        <span>Don't have an account?</span>
        <router-link to="/register" class="auth-link">Create Account</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { Message, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref('');

const form = ref({
  email: '',
  password: ''
});

async function handleLogin() {
  if (!form.value.email || !form.value.password) {
    error.value = 'Please fill in all fields';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await authStore.login({
      email: form.value.email,
      password: form.value.password
    });

    ElMessage.success('Welcome back!');
    
    if (!res.user.hasCompletedInitialSetup) {
      router.push({ name: 'setup' });
    } else {
      const redirect = route.query.redirect || '/';
      router.push(redirect);
    }
  } catch (err) {
    error.value = err.message || 'Invalid email or password';
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
    max-width: 420px;
    background: #ffffff;
    padding: 2.5rem;
    border-radius: 20px;

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
}
</style>
