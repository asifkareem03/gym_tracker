<template>
  <div class="measurements-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Body Measurements</h1>
        <p class="page-subtitle">Track body weight, waist, and neck circumference trends</p>
      </div>

      <el-button type="primary" size="large" :icon="Plus" @click="openAddDialog('weight')">
        <span>Log New Measurement</span>
      </el-button>
    </div>

    <!-- Cards Grid -->
    <div class="cards-grid" v-loading="measurementStore.loading">
      <!-- Weight Card -->
      <MeasurementCard
        type="weight"
        title="Weight Tracker"
        unit="kg"
        icon="⚖️"
        :history="measurementStore.byType('weight')"
        @add="openAddDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />

      <!-- Waist Card -->
      <MeasurementCard
        type="waist"
        title="Waist Circumference"
        unit="cm"
        icon="📏"
        :history="measurementStore.byType('waist')"
        @add="openAddDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />

      <!-- Neck Card -->
      <MeasurementCard
        type="neck"
        title="Neck Circumference"
        unit="cm"
        icon="👔"
        :history="measurementStore.byType('neck')"
        @add="openAddDialog"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </div>

    <!-- Add/Edit Measurement Modal -->
    <MeasurementDialog
      v-model="showDialog"
      :measurement="editingItem"
      :default-type="dialogType"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMeasurementStore } from '../stores/measurementStore.js';
import MeasurementCard from '../components/MeasurementCard.vue';
import MeasurementDialog from '../components/MeasurementDialog.vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';

const measurementStore = useMeasurementStore();

const showDialog = ref(false);
const editingItem = ref(null);
const dialogType = ref('weight');

function openAddDialog(type = 'weight') {
  editingItem.value = null;
  dialogType.value = type;
  showDialog.value = true;
}

function openEditDialog(item) {
  editingItem.value = item;
  dialogType.value = item.type;
  showDialog.value = true;
}

function handleSaved() {
  measurementStore.fetchMeasurements();
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this measurement entry?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );

    await measurementStore.deleteMeasurement(id);
    ElMessage.success('Measurement deleted');
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || 'Failed to delete measurement');
    }
  }
}

onMounted(() => {
  measurementStore.fetchMeasurements();
});
</script>

<style lang="scss" scoped>
.measurements-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;

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

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}
</style>
