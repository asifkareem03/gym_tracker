<template>
  <el-dialog
    v-model="visible"
    title="Weekly Progress Check-in 💪"
    width="450px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <p class="dialog-subtitle">
      Happy Monday! Take a quick minute to record your current body measurements to keep tracking your fitness progress.
    </p>

    <el-form label-position="top" class="checkin-form">
      <el-form-item label="Body Weight (kg)">
        <el-input-number
          v-model="form.weight"
          :min="1"
          :max="500"
          :precision="1"
          :step="0.5"
          placeholder="e.g. 77.0"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="Waist Circumference (cm)">
        <el-input-number
          v-model="form.waist"
          :min="1"
          :max="300"
          :precision="1"
          :step="0.5"
          placeholder="e.g. 91.0"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="Neck Circumference (cm)">
        <el-input-number
          v-model="form.neck"
          :min="1"
          :max="300"
          :precision="1"
          :step="0.5"
          placeholder="e.g. 42.0"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="Notes (optional)">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="How are you feeling this week? Any diet or training notes?"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleSkip">Skip for now</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save Weekly Measurements</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCheckinStore } from '../stores/checkinStore.js';
import { useMeasurementStore } from '../stores/measurementStore.js';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'completed']);

const checkinStore = useCheckinStore();
const measurementStore = useMeasurementStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const saving = ref(false);

const latestWeight = measurementStore.latestByType('weight')?.value || 75;
const latestWaist = measurementStore.latestByType('waist')?.value || 85;
const latestNeck = measurementStore.latestByType('neck')?.value || 40;

const form = ref({
  weight: latestWeight,
  waist: latestWaist,
  neck: latestNeck,
  notes: ''
});

function handleSkip() {
  checkinStore.dismissDialog();
  visible.value = false;
}

async function handleSave() {
  saving.value = true;
  try {
    await checkinStore.submitCheckin({
      weight: form.value.weight,
      waist: form.value.waist,
      neck: form.value.neck,
      notes: form.value.notes
    });

    await measurementStore.fetchMeasurements();

    ElMessage.success('Weekly check-in saved successfully! 💪');
    visible.value = false;
    emit('completed');
  } catch (err) {
    ElMessage.error(err.message || 'Failed to save weekly check-in');
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.dialog-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 1.25rem;
}

.checkin-form {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
