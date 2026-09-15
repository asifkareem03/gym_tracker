<template>
  <div class="new-workout-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Workout Log' : 'Log New Workout' }}</h1>
        <p class="page-subtitle">Record your sets, reps, and weights for today's session</p>
      </div>

      <el-button size="large" @click="router.back()">Cancel</el-button>
    </div>

    <div class="form-container" v-loading="loading">
      <!-- Main Settings Card -->
      <div class="settings-card gym-card">
        <div class="settings-grid">
          <!-- Workout Date Picker -->
          <div class="form-field">
            <div class="field-label-wrapper">
              <label class="field-label">Workout Date</label>
              <span class="label-help-tag">Select date to fetch log</span>
            </div>
            <div class="date-picker-row">
              <el-date-picker
                v-model="form.workoutDate"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="disabledFutureDates"
                placeholder="Select date"
                size="large"
                style="flex: 1;"
                @change="handleDateSelect"
              />
              <el-button 
                type="warning" 
                plain 
                size="large" 
                class="move-date-btn"
                title="Relocate this workout log to a different date"
                @click="openMoveDialog"
              >
                <el-icon><Calendar /></el-icon>
                <span>Move Date</span>
              </el-button>
            </div>
          </div>

          <!-- Day Type -->
          <div class="form-field">
            <label class="field-label">Day Type</label>
            <el-radio-group v-model="form.dayType" size="large" @change="handleTypeChange">
              <el-radio-button value="workout">💪 Workout Day</el-radio-button>
              <el-radio-button value="rest">🌿 Rest Day</el-radio-button>
            </el-radio-group>
          </div>

          <!-- Workout Group -->
          <div class="form-field" v-if="form.dayType === 'workout'">
            <label class="field-label">Workout Group</label>
            <el-select 
              v-model="form.groupId" 
              placeholder="Select Workout Group" 
              size="large" 
              style="width: 100%;"
            >
              <el-option
                v-for="group in exerciseStore.groups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-field notes-field">
          <label class="field-label">Session Notes</label>
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="2"
            placeholder="Add overall notes about energy level, focus, or session highlights..."
          />
        </div>
      </div>

      <!-- Exercises Section (Only if Workout Day) -->
      <div v-if="form.dayType === 'workout'" class="exercises-section">
        <div class="section-title-bar">
          <div class="heading-group">
            <h2 class="section-heading">Exercises ({{ form.exercises.length }})</h2>
            <el-button 
              v-if="form.exercises.length > 0"
              size="small" 
              circle
              plain 
              class="collapse-all-btn"
              :title="allCollapsed ? 'Expand All' : 'Collapse All'"
              @click="allCollapsed = !allCollapsed"
            >
              <el-icon><ArrowDown v-if="allCollapsed" /><ArrowUp v-else /></el-icon>
            </el-button>
          </div>

          <div class="add-ex-wrapper">
            <el-select
              v-model="selectedExToAdd"
              filterable
              allow-create
              default-first-option
              placeholder="Select exercise from list..."
              size="large"
              style="min-width: 280px;"
              @change="addExercise"
            >
              <el-option-group
                v-for="group in groupedExerciseOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="ex in group.options"
                  :key="ex._id || ex.name"
                  :label="ex.name"
                  :value="ex.name"
                />
              </el-option-group>
            </el-select>

            <el-button 
              type="primary" 
              plain 
              size="large" 
              :icon="Plus"
              @click="openCustomExDialog"
            >
              <span>Add Custom Exercise</span>
            </el-button>
          </div>
        </div>

        <div v-if="form.exercises.length === 0" class="no-exercises-box gym-card">
          <EmptyState
            icon="🏋️‍♂️"
            title="No Exercises Added Yet"
            description="Select an exercise from the dropdown above or click 'Add Custom Exercise' to start recording your sets."
          />
        </div>

        <div v-else class="exercise-cards-list">
          <div 
            v-for="group in groupedWorkoutExercises" 
            :key="group.label" 
            class="exercise-subgroup-block"
          >
            <div class="subgroup-header">
              <span class="subgroup-title">{{ group.label }}</span>
              <span class="subgroup-count">{{ group.items.length }} exercise{{ group.items.length > 1 ? 's' : '' }}</span>
            </div>
            <div class="subgroup-items">
              <ExerciseCard
                v-for="item in group.items"
                :key="item.originalIndex"
                :exercise="item.ex"
                :collapsed="allCollapsed"
                :grouped-exercise-options="groupedExerciseOptions"
                @remove="removeExercise(item.originalIndex)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions Bar -->
      <div class="save-bar">
        <el-button 
          type="primary" 
          size="large" 
          class="save-btn" 
          :loading="saving" 
          @click="handleSave"
        >
          Save Workout Log
        </el-button>
      </div>
    </div>

    <!-- Modal Dialog to Create New Custom Exercise -->
    <el-dialog
      v-model="showCustomDialog"
      title="Add New Custom Exercise"
      width="420px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="Exercise Name">
          <el-input 
            v-model="customExName" 
            placeholder="e.g. Machine Press"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Workout Group">
          <el-select 
            v-model="customExGroup" 
            size="large" 
            style="width: 100%;"
            @change="handleCustomGroupChange"
          >
            <el-option
              v-for="group in mainWorkoutGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Specific Muscle Category">
          <el-select v-model="customExSubGroup" size="large" style="width: 100%;">
            <el-option
              v-for="sg in availableSubGroupOptions"
              :key="sg"
              :label="sg"
              :value="sg"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCustomDialog = false">Cancel</el-button>
          <el-button type="primary" :loading="creatingCustom" @click="handleSaveCustomExercise">
            Save & Add to Workout
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Move Workout Log to Another Date Dialog -->
    <el-dialog
      v-model="showMoveDialog"
      title="Move Workout Log to New Date"
      width="440px"
      destroy-on-close
    >
      <div class="move-dialog-content">
        <p class="move-desc">
          Select a new date to relocate this workout log (currently on <strong>{{ formatDate(form.workoutDate) }}</strong>):
        </p>
        <el-date-picker
          v-model="targetMoveDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledFutureDates"
          placeholder="Select target date"
          size="large"
          style="width: 100%; margin-top: 1rem;"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMoveDialog = false">Cancel</el-button>
          <el-button 
            type="warning" 
            :loading="moving" 
            :disabled="!targetMoveDate || targetMoveDate === form.workoutDate" 
            @click="executeMoveWorkout"
          >
            Confirm & Move
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useWorkoutStore } from '../stores/workoutStore.js';
import { useExerciseStore } from '../stores/exerciseStore.js';
import { exerciseService } from '../services/exerciseService.js';
import { workoutService } from '../services/workoutService.js';
import { useAuthStore } from '../stores/authStore.js';
import { getTodayDateString, formatDate } from '../utils/date.js';
import ExerciseCard from '../components/ExerciseCard.vue';
import EmptyState from '../components/EmptyState.vue';
import { Plus, ArrowUp, ArrowDown, Calendar } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps({
  id: String
});

const workoutStore = useWorkoutStore();
const exerciseStore = useExerciseStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!props.id);
const loading = ref(false);
const saving = ref(false);
const selectedExToAdd = ref('');
const allCollapsed = ref(true);

const showMoveDialog = ref(false);
const targetMoveDate = ref('');
const moving = ref(false);

const showCustomDialog = ref(false);
const customExName = ref('');
const customExGroup = ref('chest_triceps');
const customExSubGroup = ref('Chest');
const creatingCustom = ref(false);

const mainWorkoutGroups = [
  { id: 'chest_triceps', name: 'Chest + Triceps' },
  { id: 'back_biceps', name: 'Back + Biceps' },
  { id: 'shoulders_abs', name: 'Shoulders + Abs' },
  { id: 'legs', name: 'Legs' }
];

const availableSubGroupOptions = computed(() => {
  const g = customExGroup.value;
  if (g === 'chest_triceps') return ['Chest', 'Triceps'];
  if (g === 'back_biceps') return ['Back', 'Biceps'];
  if (g === 'shoulders_abs') return ['Shoulders', 'Abs'];
  if (g === 'legs') return ['Legs'];
  return ['Chest', 'Triceps'];
});

const form = ref({
  workoutDate: getTodayDateString(authStore.userTimezone),
  dayType: 'workout',
  groupId: 'chest_triceps',
  notes: '',
  exercises: []
});

function disabledFutureDates(time) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return time.getTime() > today.getTime();
}

// List of exercises filtered by current workout group
const filteredExerciseOptions = computed(() => {
  const selectedGroup = form.value.groupId;
  const allExercises = exerciseStore.exercises;

  if (!selectedGroup || selectedGroup === 'all' || selectedGroup === 'full_body' || selectedGroup === 'custom') {
    return allExercises;
  }

  const filtered = allExercises.filter(e => e.groupId === selectedGroup);
  return filtered.length > 0 ? filtered : allExercises;
});

// Helper to derive muscle category for grouping in dropdown
function getSubGroupLabel(ex) {
  if (ex.subGroup && ex.subGroup !== 'Custom') return ex.subGroup;
  
  const name = (ex.name || '').toLowerCase();
  const gid = ex.groupId;

  if (gid === 'chest_triceps') {
    if (name.includes('triceps') || name.includes('pushdown') || name.includes('extension') || name.includes('crusher') || name.includes('dips')) {
      return 'Triceps';
    }
    return 'Chest';
  }

  if (gid === 'back_biceps') {
    if (name.includes('curl') || name.includes('biceps') || name.includes('preacher') || name.includes('hammer')) {
      return 'Biceps';
    }
    return 'Back';
  }

  if (gid === 'shoulders_abs') {
    if (name.includes('plank') || name.includes('crunch') || name.includes('abs') || (name.includes('raise') && name.includes('leg')) || name.includes('twist')) {
      return 'Abs';
    }
    return 'Shoulders';
  }

  if (gid === 'legs') return 'Legs';

  // Keyword categorization fallback
  if (name.includes('face pull') || name.includes('shoulder') || name.includes('lateral') || name.includes('delt') || name.includes('shrug') || name.includes('arnold')) return 'Shoulders';
  if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('push up')) return 'Chest';
  if (name.includes('tricep') || name.includes('dips')) return 'Triceps';
  if (name.includes('row') || name.includes('pulldown') || name.includes('pull up') || name.includes('lats') || (name.includes('deadlift') && !name.includes('romanian'))) return 'Back';
  if (name.includes('bicep') || name.includes('curl')) return 'Biceps';
  if (name.includes('squat') || name.includes('press') || name.includes('lunge') || name.includes('calf') || name.includes('leg')) return 'Legs';
  if (name.includes('plank') || name.includes('crunch')) return 'Abs';

  return 'Chest';
}

// Group options by subGroup (Chest, Triceps, Back, Biceps, Shoulders, Abs, Legs) for el-option-group
const groupedExerciseOptions = computed(() => {
  const exercises = filteredExerciseOptions.value || [];
  const groupsMap = {};

  exercises.forEach(ex => {
    const label = getSubGroupLabel(ex);
    if (!groupsMap[label]) {
      groupsMap[label] = [];
    }
    groupsMap[label].push(ex);
  });

  const preferredOrder = ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Abs', 'Legs'];
  const result = [];

  preferredOrder.forEach(label => {
    if (groupsMap[label] && groupsMap[label].length > 0) {
      result.push({
        label,
        options: groupsMap[label]
      });
    }
  });

  Object.keys(groupsMap).forEach(label => {
    if (!preferredOrder.includes(label) && groupsMap[label].length > 0) {
      result.push({
        label,
        options: groupsMap[label]
      });
    }
  });

  return result;
});

// Group user added workout exercises by subGroup (Chest, Triceps, etc.)
const groupedWorkoutExercises = computed(() => {
  const map = {};
  (form.value.exercises || []).forEach((ex, originalIndex) => {
    const storeEx = exerciseStore.exercises.find(
      e => e.name.toLowerCase() === (ex.exerciseName || '').toLowerCase()
    );
    const subGroup = (storeEx && storeEx.subGroup) || getSubGroupLabel(storeEx || { name: ex.exerciseName, groupId: form.value.groupId });
    if (!map[subGroup]) {
      map[subGroup] = [];
    }
    map[subGroup].push({ ex, originalIndex });
  });

  const preferredOrder = ['Chest', 'Triceps', 'Back', 'Biceps', 'Shoulders', 'Abs', 'Legs'];
  const result = [];

  preferredOrder.forEach(label => {
    if (map[label] && map[label].length > 0) {
      result.push({ label, items: map[label] });
    }
  });

  Object.keys(map).forEach(label => {
    if (!preferredOrder.includes(label) && map[label].length > 0) {
      result.push({ label, items: map[label] });
    }
  });

  return result;
});

function handleTypeChange(newType) {
  if (isEdit.value && form.value.dayType === 'rest') {
    ElMessageBox.confirm(
      'Converting a workout into a Rest Day will remove all recorded exercises for this date. Continue?',
      'Warning',
      {
        confirmButtonText: 'Yes, Convert',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    ).catch(() => {
      form.value.dayType = 'workout';
    });
  }
}

function openCustomExDialog() {
  customExName.value = '';
  let currentG = form.value.groupId || 'chest_triceps';
  if (!mainWorkoutGroups.some(g => g.id === currentG)) {
    currentG = 'chest_triceps';
  }
  customExGroup.value = currentG;
  handleCustomGroupChange(currentG);

  showCustomDialog.value = true;
}

function handleCustomGroupChange(newG) {
  const opts = availableSubGroupOptions.value;
  if (opts && opts.length > 0) {
    customExSubGroup.value = opts[0];
  } else {
    customExSubGroup.value = 'Chest';
  }
}

async function handleSaveCustomExercise() {
  if (!customExName.value || !customExName.value.trim()) {
    ElMessage.error('Please enter an exercise name');
    return;
  }

  creatingCustom.value = true;
  try {
    const trimmedName = customExName.value.trim();
    const res = await exerciseService.createExercise({
      name: trimmedName,
      groupId: customExGroup.value,
      subGroup: customExSubGroup.value
    });

    if (res.exercise) {
      const idx = exerciseStore.exercises.findIndex(e => e.name.toLowerCase() === trimmedName.toLowerCase());
      if (idx !== -1) {
        exerciseStore.exercises[idx] = res.exercise;
      } else {
        exerciseStore.exercises.push(res.exercise);
      }
    }

    await addExercise(trimmedName);

    ElMessage.success(`Custom exercise "${trimmedName}" saved under ${customExSubGroup.value}!`);
    showCustomDialog.value = false;
  } catch (e) {
    ElMessage.error(e.message || 'Failed to save custom exercise');
  } finally {
    creatingCustom.value = false;
  }
}

async function addExercise(exName) {
  if (!exName || !exName.trim()) return;
  const trimmedName = exName.trim();

  // If exercise does not exist in store, save as new custom exercise to DB
  const existing = exerciseStore.exercises.find(
    e => e.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (!existing) {
    try {
      const res = await exerciseService.createExercise({
        name: trimmedName,
        groupId: form.value.groupId
      });
      if (res.exercise) {
        exerciseStore.exercises.push(res.exercise);
      }
    } catch (e) {
      console.error('Failed to persist custom exercise:', e);
    }
  }

  // Fetch last performance for this exercise
  let lastPerf = [];
  let defaultWeight = 20;
  let defaultReps = 10;

  try {
    const prog = await workoutService.getExerciseProgress(trimmedName);
    if (prog && prog.history && prog.history.length > 0 && prog.stats?.latestWorkoutDate) {
      const latestDate = prog.stats.latestWorkoutDate;
      const lastSessionSets = prog.history.filter(h => h.workoutDate === latestDate);
      if (lastSessionSets.length > 0) {
        lastPerf = lastSessionSets;
        defaultWeight = lastSessionSets[0].weightKg || 20;
        defaultReps = lastSessionSets[0].reps || 10;
      }
    }
  } catch (e) {
    console.error('Failed to fetch previous progress:', e);
  }

  form.value.exercises.push({
    exerciseName: trimmedName,
    lastPerformance: lastPerf,
    sets: [
      { setNumber: 1, weightKg: defaultWeight, reps: defaultReps, completed: true }
    ],
    notes: ''
  });

  selectedExToAdd.value = '';
}

function removeExercise(index) {
  form.value.exercises.splice(index, 1);
}

async function handleSave() {
  if (!form.value.workoutDate) {
    ElMessage.error('Please select a workout date');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      workoutDate: form.value.workoutDate,
      dayType: form.value.dayType,
      groupId: form.value.groupId,
      notes: form.value.notes,
      exercises: form.value.exercises
    };

    if (isEdit.value) {
      await workoutStore.updateWorkout(props.id, payload);
      ElMessage.success('Workout updated successfully!');
    } else {
      await workoutStore.saveWorkout(payload);
      ElMessage.success('Workout logged successfully!');
    }
    router.push('/history');
  } catch (err) {
    ElMessage.error(err.message || 'Failed to save workout');
  } finally {
    saving.value = false;
  }
}

async function handleDateSelect(newDate) {
  if (!newDate) return;

  loading.value = true;
  try {
    const existing = await workoutStore.fetchWorkoutByDate(newDate);
    if (existing && (existing.id || existing._id)) {
      const eId = existing.id || existing._id;
      if (isEdit.value && eId === props.id) {
        // Same workout log, do nothing
        return;
      }
      ElMessage.info(`Loaded workout log for ${formatDate(newDate)}`);
      router.push(`/workout/edit/${eId}`);
    } else {
      ElMessage.info(`Switched to ${formatDate(newDate)} (New Log)`);
      router.push(`/workout/new?date=${newDate}`);
    }
  } catch (err) {
    console.error('Failed to load workout for date:', err);
  } finally {
    loading.value = false;
  }
}

function openMoveDialog() {
  targetMoveDate.value = form.value.workoutDate;
  showMoveDialog.value = true;
}

async function executeMoveWorkout() {
  if (!targetMoveDate.value || targetMoveDate.value === form.value.workoutDate) return;
  const targetDateStr = targetMoveDate.value;
  const currentId = props.id;

  moving.value = true;
  try {
    const existingTarget = await workoutStore.fetchWorkoutByDate(targetDateStr);
    const existingTargetId = existingTarget ? (existingTarget.id || existingTarget._id) : null;

    if (existingTarget && existingTargetId && existingTargetId !== currentId) {
      // Conflict detected!
      const currentGroup = formatGroupName(form.value.groupId);
      const targetGroup = formatGroupName(existingTarget.groupId);
      const targetDateFormatted = formatDate(targetDateStr);

      showMoveDialog.value = false;
      moving.value = false;

      await ElMessageBox.confirm(
        `Target date (${targetDateFormatted}) already has a logged workout (${targetGroup}). Moving this workout log (${currentGroup}) will merge all exercises into ${targetDateFormatted}. Since two workout groups are combined, the Workout Group will automatically be set to 'Full Body'. Do you want to proceed?`,
        'Merge Workouts & Change to Full Body',
        {
          confirmButtonText: 'Yes, Merge Workouts',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      );

      moving.value = true;

      // Combine exercise lists
      const existingExercises = existingTarget.exercises || [];
      const currentExercises = form.value.exercises || [];

      const mergedExercises = [...existingExercises];
      currentExercises.forEach(cEx => {
        const idx = mergedExercises.findIndex(
          e => e.exerciseName.toLowerCase() === cEx.exerciseName.toLowerCase()
        );
        if (idx !== -1) {
          const existingSets = mergedExercises[idx].sets || [];
          const newSets = (cEx.sets || []).map((s, sIdx) => ({
            ...s,
            setNumber: existingSets.length + sIdx + 1
          }));
          mergedExercises[idx].sets = [...existingSets, ...newSets];
        } else {
          mergedExercises.push(cEx);
        }
      });

      // Group logic: If different groups, set to full_body
      let finalGroupId = 'full_body';
      if (existingTarget.groupId === form.value.groupId) {
        finalGroupId = form.value.groupId;
      }

      const mergedNotes = [existingTarget.notes, form.value.notes]
        .filter(Boolean)
        .join(' | ');

      // Save merged workout to target date
      await workoutStore.updateWorkout(existingTargetId, {
        dayType: 'workout',
        groupId: finalGroupId,
        notes: mergedNotes,
        exercises: mergedExercises
      });

      // Delete original workout from old date if editing existing
      if (currentId) {
        await workoutStore.deleteWorkout(currentId);
      }

      ElMessage.success(`Merged into ${targetDateFormatted} (Full Body)!`);
      router.push(`/workout/edit/${existingTargetId}`);
    } else {
      // Simple relocation to empty target date
      if (isEdit.value && currentId) {
        await workoutStore.updateWorkout(currentId, {
          workoutDate: targetDateStr,
          dayType: form.value.dayType,
          groupId: form.value.groupId,
          notes: form.value.notes,
          exercises: form.value.exercises
        });
      } else {
        await workoutStore.saveWorkout({
          workoutDate: targetDateStr,
          dayType: form.value.dayType,
          groupId: form.value.groupId,
          notes: form.value.notes,
          exercises: form.value.exercises
        });
      }

      ElMessage.success(`Workout moved to ${formatDate(targetDateStr)}!`);
      showMoveDialog.value = false;

      const updatedRecord = await workoutStore.fetchWorkoutByDate(targetDateStr);
      if (updatedRecord && (updatedRecord.id || updatedRecord._id)) {
        router.push(`/workout/edit/${updatedRecord.id || updatedRecord._id}`);
      } else {
        router.push('/history');
      }
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || 'Failed to move workout date');
    }
  } finally {
    moving.value = false;
  }
}

async function loadWorkoutViewData() {
  loading.value = true;
  try {
    await Promise.all([
      exerciseStore.fetchGroups(),
      exerciseStore.fetchExercises()
    ]);

    if (isEdit.value && props.id) {
      const workout = await workoutStore.fetchWorkoutById(props.id);
      form.value = {
        workoutDate: workout.workoutDate,
        dayType: workout.dayType || 'workout',
        groupId: workout.groupId || 'chest_triceps',
        notes: workout.notes || '',
        exercises: (workout.exercises || []).map(ex => ({
          exerciseName: ex.exerciseName,
          sets: (ex.sets || []).map(s => ({ ...s })),
          notes: ex.notes || ''
        }))
      };
    } else {
      const targetDate = route.query.date || getTodayDateString(authStore.userTimezone);
      form.value.workoutDate = targetDate;
      await handleDateSelect(targetDate);
    }
  } catch (e) {
    console.error('Error loading workout view data:', e);
    ElMessage.error('Failed to load workout data');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWorkoutViewData();
});

watch(
  () => route.fullPath,
  () => {
    loadWorkoutViewData();
  }
);
</script>

<style lang="scss" scoped>
.new-workout-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-text-main);
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: var(--color-text-muted);
    }
  }

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      .field-label {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      &.notes-field {
        margin-top: 0.5rem;
      }
    }

    .exercises-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .section-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;

        .heading-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .section-heading {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--color-text-main);
          }
        }

        .add-ex-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
      }

      .exercise-cards-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .exercise-subgroup-block {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .subgroup-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 0.75rem;
            background: #f8fafc;
            border-left: 4px solid var(--color-primary);
            border-radius: 6px;

            .subgroup-title {
              font-weight: 800;
              font-size: 0.95rem;
              color: var(--color-text-main);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .subgroup-count {
              font-size: 0.75rem;
              color: var(--color-text-muted);
              background: #e2e8f0;
              padding: 2px 8px;
              border-radius: 9999px;
              font-weight: 600;
            }
          }

          .subgroup-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
        }
      }
    }

    .save-bar {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;

      .save-btn {
        height: 52px;
        padding: 0 2.5rem;
        font-size: 1.1rem;
        border-radius: 12px;
      }
    }
  }

  .field-label-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;

    .label-help-tag {
      font-size: 0.7rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }
  }

  .date-picker-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .move-date-btn {
      white-space: nowrap;
      font-weight: 700;
    }
  }

  .move-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .move-desc {
      font-size: 0.95rem;
      color: var(--color-text-main);
      line-height: 1.5;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}
</style>
