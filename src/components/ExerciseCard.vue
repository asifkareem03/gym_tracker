<template>
  <div class="exercise-card gym-card" :class="{ 'is-collapsed': isCollapsed }">
    <!-- Header with Collapse Toggle -->
    <div class="exercise-header" @click="toggleCollapse">
      <div class="exercise-title">
        <el-button 
          size="small" 
          circle 
          plain 
          class="collapse-btn" 
          @click.stop="toggleCollapse"
        >
          <el-icon><ArrowUp v-if="!isCollapsed" /><ArrowDown v-else /></el-icon>
        </el-button>

        <template v-if="!isEditingName">
          <span class="exercise-name">{{ exercise.exerciseName }}</span>
          <el-button 
            size="small" 
            circle 
            link 
            class="edit-name-btn"
            title="Rename exercise" 
            @click.stop="startEditName"
          >
            <el-icon><EditPen /></el-icon>
          </el-button>
        </template>
        <template v-else>
          <div class="edit-name-box" @click.stop>
            <el-select 
              v-model="editingNameText" 
              filterable 
              allow-create 
              default-first-option 
              placeholder="Select or type exercise..." 
              size="small" 
              style="width: 260px;"
            >
              <el-option-group
                v-for="g in groupedExerciseOptions"
                :key="g.label"
                :label="g.label"
              >
                <el-option
                  v-for="op in g.options"
                  :key="op._id || op.name"
                  :label="op.name"
                  :value="op.name"
                />
              </el-option-group>
            </el-select>
            <el-button size="small" type="success" circle @click="saveEditedName">
              <el-icon><Check /></el-icon>
            </el-button>
            <el-button size="small" circle @click="cancelEditName">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </template>

        <span class="sets-count-badge">
          {{ exercise.sets?.length || 0 }} set{{ (exercise.sets?.length || 0) === 1 ? '' : 's' }}
        </span>

        <span v-if="isCollapsed" class="collapsed-summary">
          • {{ formatCollapsedSets(exercise.sets) }}
        </span>
      </div>

      <div class="header-actions" @click.stop>
        <el-button 
          v-if="isCollapsed" 
          size="small" 
          type="primary" 
          plain 
          class="edit-card-btn"
          @click.stop="toggleCollapse"
        >
          <el-icon><Edit /></el-icon>
          <span>Edit</span>
        </el-button>
        <el-button size="small" type="danger" plain circle @click="$emit('remove')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Collapsible Body -->
    <div v-show="!isCollapsed" class="exercise-card-body">
      <!-- Last Performance Banner -->
      <div v-if="exercise.lastPerformance && exercise.lastPerformance.length > 0" class="last-perf-banner">
        <span class="perf-label">💡 Last Time Done:</span>
        <span class="perf-details">
          <template v-for="(lp, pIdx) in exercise.lastPerformance" :key="pIdx">
            Set {{ lp.setNumber }}: <strong>{{ lp.weightKg }}kg × {{ lp.reps }} reps</strong><template v-if="pIdx < exercise.lastPerformance.length - 1"> • </template>
          </template>
        </span>
        <el-button size="small" type="primary" link @click="copyLastPerformance">Use Last Sets</el-button>
      </div>

      <!-- Sets Table -->
      <div class="sets-table-wrapper">
        <table class="sets-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight (kg)</th>
              <th>Reps</th>
              <th class="text-center">Done</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(set, idx) in exercise.sets" :key="idx">
              <td class="set-number-col">
                <span class="set-badge">{{ idx + 1 }}</span>
              </td>
              <td>
                <el-input-number
                  v-model="set.weightKg"
                  :min="0"
                  :max="500"
                  :step="2.5"
                  size="small"
                  controls-position="right"
                  style="width: 100%;"
                ></el-input-number>
              </td>
              <td>
                <el-input-number
                  v-model="set.reps"
                  :min="0"
                  :max="200"
                  :step="1"
                  size="small"
                  controls-position="right"
                  style="width: 100%;"
                ></el-input-number>
              </td>
              <td class="text-center">
                <el-checkbox v-model="set.completed" size="large" />
              </td>
              <td class="text-right">
                <el-button 
                  size="small" 
                  type="danger" 
                  link 
                  :disabled="exercise.sets.length <= 1"
                  @click="removeSet(idx)"
                >
                  ✕
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Set Button & Exercise Notes & Save Card -->
      <div class="exercise-footer">
        <div class="footer-left">
          <el-button size="small" type="primary" plain :icon="Plus" @click="addSet">
            <span>Add Set</span>
          </el-button>

          <el-input
            v-model="exercise.notes"
            placeholder="Notes for this exercise (optional)..."
            size="small"
            style="max-width: 280px;"
          />
        </div>

        <el-button size="small" type="success" class="save-card-btn" @click="handleSaveCard">
          <el-icon><Check /></el-icon>
          <span>Save Exercise</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Plus, Delete, ArrowUp, ArrowDown, Check, Edit, EditPen, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  },
  collapsed: {
    type: Boolean,
    default: true
  },
  groupedExerciseOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['remove', 'save']);

const isCollapsed = ref(props.collapsed !== undefined ? props.collapsed : true);
const isEditingName = ref(false);
const editingNameText = ref('');

function startEditName() {
  editingNameText.value = props.exercise.exerciseName || '';
  isEditingName.value = true;
}

function saveEditedName() {
  if (editingNameText.value && editingNameText.value.trim()) {
    props.exercise.exerciseName = editingNameText.value.trim();
  }
  isEditingName.value = false;
}

function cancelEditName() {
  isEditingName.value = false;
}

watch(() => props.collapsed, (newVal) => {
  isCollapsed.value = newVal;
});

const exerciseVolume = computed(() => {
  if (!props.exercise.sets) return 0;
  return props.exercise.sets
    .filter(s => s.completed !== false)
    .reduce((acc, s) => acc + ((Number(s.weightKg) || 0) * (Number(s.reps) || 0)), 0);
});

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function formatCollapsedSets(sets) {
  if (!sets || sets.length === 0) return 'No sets';
  const completedCount = sets.filter(s => s.completed).length;
  return `${completedCount}/${sets.length} completed`;
}

function addSet() {
  const sets = props.exercise.sets || [];
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : { weightKg: 20, reps: 10 };
  sets.push({
    setNumber: sets.length + 1,
    weightKg: lastSet.weightKg || 0,
    reps: lastSet.reps || 10,
    completed: true
  });
}

function removeSet(index) {
  if (props.exercise.sets.length > 1) {
    props.exercise.sets.splice(index, 1);
    props.exercise.sets.forEach((s, idx) => s.setNumber = idx + 1);
  }
}

function copyLastPerformance() {
  if (props.exercise.lastPerformance && props.exercise.lastPerformance.length > 0) {
    props.exercise.sets = props.exercise.lastPerformance.map((lp, idx) => ({
      setNumber: idx + 1,
      weightKg: lp.weightKg,
      reps: lp.reps,
      completed: true
    }));
  }
}

function handleSaveCard() {
  isCollapsed.value = true;
  ElMessage.success(`${props.exercise.exerciseName || 'Exercise'} saved locally`);
  emit('save', props.exercise);
}
</script>

<style lang="scss" scoped>
.exercise-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  transition: all 0.2s ease;

  .exercise-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
    padding: 0.25rem 0;

    .exercise-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;

      .collapse-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        min-height: 28px;
      }

      .exercise-name {
        font-family: var(--font-heading);
        font-weight: 700;
        font-size: 1.05rem;
        color: var(--color-text-main);
      }

      .edit-name-btn {
        color: #94a3b8;
        padding: 0;
        &:hover {
          color: var(--color-primary);
        }
      }

      .edit-name-box {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .sets-count-badge {
        font-size: 0.75rem;
        background: #f1f5f9;
        color: #475569;
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 600;
      }

      .volume-badge {
        font-size: 0.75rem;
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #a7f3d0;
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 700;
      }

      .collapsed-summary {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .exercise-card-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  .last-perf-banner {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    color: #1e40af;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;

    .perf-label {
      font-weight: 700;
    }

    .perf-details {
      flex: 1;
    }
  }

  .sets-table-wrapper {
    overflow-x: auto;

    .sets-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        font-weight: 600;
        color: var(--color-text-muted);
        padding: 0.5rem;
        border-bottom: 1px solid var(--color-border);
      }

      td {
        padding: 0.5rem;
        vertical-align: middle;
      }
    }
  }

  .set-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.75rem;
  }

  .text-center { text-align: center; }
  .text-right { text-align: right; }

  .exercise-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--color-border);

    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      flex: 1;
    }

    .save-card-btn {
      font-weight: 600;
    }
  }
}
</style>
