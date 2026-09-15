<template>
  <div class="setup-page">
    <div class="setup-card gym-card">
      <div class="setup-header">
        <div class="emoji-wave">👋</div>
        <h1 class="setup-title">Welcome to Gym Tracker</h1>
        <p class="setup-subtitle">
          Let's set your starting body measurements. This helps us track your weight and body composition changes over time.
        </p>
      </div>

      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
        style="margin-bottom: 1.25rem"
      ></el-alert>

      <el-form label-position="top" size="large" @submit.prevent="handleSave">
        <div class="inputs-grid">
          <el-form-item label="Body Weight (kg)">
            <el-input-number
              v-model="form.weight"
              :min="1"
              :max="500"
              :precision="1"
              :step="0.5"
              placeholder="77.0"
              style="width: 100%"
            ></el-input-number>
          </el-form-item>

          <el-form-item label="Waist (cm)">
            <el-input-number
              v-model="form.waist"
              :min="1"
              :max="300"
              :precision="1"
              :step="0.5"
              placeholder="91.0"
              style="width: 100%"
            ></el-input-number>
          </el-form-item>

          <el-form-item label="Neck (cm)">
            <el-input-number
              v-model="form.neck"
              :min="1"
              :max="300"
              :precision="1"
              :step="0.5"
              placeholder="42.0"
              style="width: 100%"
            ></el-input-number>
          </el-form-item>
        </div>

        <div class="actions-row">
          <el-button
            type="primary"
            class="save-btn"
            :loading="loading"
            native-type="submit"
          >
            Save Measurements
          </el-button>

          <el-button
            type="info"
            plain
            class="skip-btn"
            @click="handleSkip"
          >
            Skip for Now
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurementStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { getTodayDateString } from '../utils/date.js';
import { ElMessage } from 'element-plus';

const measurementStore = useMeasurementStore();
const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref('');

const form = ref({
  weight: 77.0,
  waist: 91.0,
  neck: 42.0
});

async function handleSave() {
  if (form.value.weight <= 0 || form.value.waist <= 0 || form.value.neck <= 0) {
    error.value = 'Measurement values must be greater than zero';
    return;
  }

  loading.value = true;
  error.value = '';

  const todayStr = getTodayDateString(authStore.userTimezone);

  const items = [
    { type: 'weight', value: form.value.weight, unit: 'kg', measurementDate: todayStr, isInitial: true, notes: 'Starting weight' },
    { type: 'waist', value: form.value.waist, unit: 'cm', measurementDate: todayStr, isInitial: true, notes: 'Starting waist' },
    { type: 'neck', value: form.value.neck, unit: 'cm', measurementDate: todayStr, isInitial: true, notes: 'Starting neck' },
  ];

  try {
    await measurementStore.saveInitialSetup(items);
    authStore.markSetupComplete();
    ElMessage.success('Initial setup completed! Welcome to your dashboard 💪');
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.message || 'Failed to save measurements';
  } finally {
    loading.value = false;
  }
}

function handleSkip() {
  authStore.markSetupComplete();
  ElMessage.info('Setup skipped. You can log measurements anytime under Body Measurements.');
  router.push({ name: 'dashboard' });
}
</script>

<style lang="scss" scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0f172a;
  padding: 1.5rem;

  .setup-card {
    width: 100%;
    max-width: 520px;
    background: #ffffff;
    padding: 2.5rem;
    border-radius: 20px;
  }

  .setup-header {
    text-align: center;
    margin-bottom: 2rem;

    .emoji-wave {
      font-size: 3.5rem;
      margin-bottom: 0.5rem;
    }

    .setup-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
    }

    .setup-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: 0.5rem;
      line-height: 1.5;
    }
  }

  .inputs-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .actions-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .save-btn {
      height: 48px;
      font-size: 1rem;
      border-radius: 10px;
      width: 100%;
    }

    .skip-btn {
      height: 42px;
      border-radius: 10px;
      width: 100%;
    }
  }
}
</style>
