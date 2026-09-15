<template>
  <el-dialog
    v-model="visible"
    :title="`Edit Log - ${formattedDate}`"
    width="500px"
    destroy-on-close
  >
    <el-form label-position="top">
      <el-form-item label="Day Type">
        <el-radio-group v-model="form.dayType" @change="handleTypeChange">
          <el-radio-button value="workout">💪 Workout Day</el-radio-button>
          <el-radio-button value="rest">🌿 Rest Day</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.dayType === 'workout'">
        <el-form-item label="Workout Group">
          <el-select v-model="form.groupId" placeholder="Select Workout Group" style="width: 100%;">
            <el-option
              v-for="group in workoutGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="Notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="Add any notes about this day..."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save Changes</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatDate } from '../utils/date.js';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useWorkoutStore } from '../stores/workoutStore.js';

const props = defineProps({
  modelValue: Boolean,
  workout: Object,
  workoutGroups: Array
});

const emit = defineEmits(['update:modelValue', 'saved']);

const workoutStore = useWorkoutStore();
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const saving = ref(false);
const form = ref({
  dayType: 'workout',
  groupId: 'chest_triceps',
  notes: ''
});

const formattedDate = computed(() => props.workout ? formatDate(props.workout.workoutDate) : '');

watch(() => props.workout, (newVal) => {
  if (newVal) {
    form.value = {
      dayType: newVal.dayType || 'workout',
      groupId: newVal.groupId || 'chest_triceps',
      notes: newVal.notes || ''
    };
  }
}, { immediate: true });

function handleTypeChange(newType) {
  if (props.workout?.dayType === 'workout' && newType === 'rest') {
    ElMessageBox.confirm(
      'Converting this workout day to a Rest Day will remove recorded exercise sets. Are you sure?',
      'Warning',
      {
        confirmButtonText: 'Yes, Convert to Rest Day',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    ).catch(() => {
      form.value.dayType = 'workout';
    });
  }
}

async function handleSave() {
  if (!props.workout?.id) return;
  saving.value = true;
  try {
    await workoutStore.updateWorkout(props.workout.id, {
      dayType: form.value.dayType,
      groupId: form.value.groupId,
      notes: form.value.notes
    });
    ElMessage.success('Updated successfully');
    visible.value = false;
    emit('saved');
  } catch (err) {
    ElMessage.error(err.message || 'Failed to update');
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
