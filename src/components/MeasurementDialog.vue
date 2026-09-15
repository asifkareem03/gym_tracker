<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Edit Measurement' : 'Add New Measurement'"
    width="420px"
    destroy-on-close
  >
    <el-form label-position="top">
      <el-form-item label="Measurement Type">
        <el-select v-model="form.type" :disabled="isEdit" style="width: 100%;">
          <el-option label="Weight (kg)" value="weight" />
          <el-option label="Waist (cm)" value="waist" />
          <el-option label="Neck (cm)" value="neck" />
        </el-select>
      </el-form-item>

      <el-form-item :label="`Value (${form.type === 'weight' ? 'kg' : 'cm'})`">
        <el-input-number
          v-model="form.value"
          :min="0.1"
          :max="form.type === 'weight' ? 500 : 300"
          :precision="1"
          :step="0.5"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="Date">
        <el-date-picker
          v-model="form.measurementDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          placeholder="Select date"
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="Notes (optional)">
        <el-input v-model="form.notes" placeholder="e.g. Morning fasting weight" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save Entry</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMeasurementStore } from '../stores/measurementStore.js';
import { getTodayDateString } from '../utils/date.js';
import { useAuthStore } from '../stores/authStore.js';
import { ElMessage } from 'element-plus';

const props = defineProps({
  modelValue: Boolean,
  measurement: Object,
  defaultType: { type: String, default: 'weight' }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const measurementStore = useMeasurementStore();
const authStore = useAuthStore();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isEdit = computed(() => !!props.measurement?.id);
const saving = ref(false);

const form = ref({
  type: 'weight',
  value: 70,
  measurementDate: getTodayDateString(),
  notes: ''
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.measurement) {
      form.value = {
        type: props.measurement.type,
        value: props.measurement.value,
        measurementDate: props.measurement.measurementDate,
        notes: props.measurement.notes || ''
      };
    } else {
      const todayStr = getTodayDateString(authStore.userTimezone);
      form.value = {
        type: props.defaultType || 'weight',
        value: props.defaultType === 'weight' ? 75 : (props.defaultType === 'waist' ? 85 : 40),
        measurementDate: todayStr,
        notes: ''
      };
    }
  }
});

async function handleSave() {
  if (!form.value.value || form.value.value <= 0) {
    ElMessage.error('Please enter a valid positive measurement value');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await measurementStore.updateMeasurement(props.measurement.id, {
        value: form.value.value,
        measurementDate: form.value.measurementDate,
        notes: form.value.notes
      });
      ElMessage.success('Measurement updated');
    } else {
      await measurementStore.saveMeasurement({
        type: form.value.type,
        value: form.value.value,
        unit: form.value.type === 'weight' ? 'kg' : 'cm',
        measurementDate: form.value.measurementDate,
        notes: form.value.notes
      });
      ElMessage.success('Measurement added');
    }
    visible.value = false;
    emit('saved');
  } catch (err) {
    ElMessage.error(err.message || 'Failed to save measurement');
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
