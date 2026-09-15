<template>
  <div class="measurement-card gym-card">
    <div class="card-header">
      <div class="type-info">
        <span class="icon">{{ icon }}</span>
        <div class="title-group">
          <h3 class="metric-title">{{ title }}</h3>
          <span class="latest-date" v-if="latest">Updated {{ formattedDate }}</span>
        </div>
      </div>
      <el-button size="small" type="primary" plain :icon="Plus" @click="$emit('add', type)">
        <span>Add {{ title }}</span>
      </el-button>
    </div>

    <!-- Stats Summary Row -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-value">{{ formatVal(latest?.value) }}</span>
        <span class="stat-label">Current</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">{{ formatVal(starting?.value) }}</span>
        <span class="stat-label">Starting</span>
      </div>
      <div class="stat-box" :class="{ 'is-loss': totalChange < 0, 'is-gain': totalChange > 0 }">
        <span class="stat-value">{{ formatChange(totalChange) }}</span>
        <span class="stat-label">Total Change</span>
      </div>
    </div>

    <!-- History Table -->
    <div class="history-section">
      <div class="history-title">History Logs</div>
      <div v-if="history.length === 0" class="empty-history">
        No measurements logged yet.
      </div>
      <div v-else class="table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th class="col-date">Date</th>
              <th class="col-val text-center">Value</th>
              <th class="col-change text-center">Change</th>
              <th class="col-actions text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in computedHistory" :key="item.id">
              <td class="col-date">
                <div class="date-wrapper">
                  <span class="date-text">{{ item.formattedDate }}</span>
                  <el-tag v-if="item.isInitial" size="small" type="info" class="initial-tag">Initial</el-tag>
                </div>
              </td>
              <td class="col-val text-center font-bold">{{ item.formattedValue }}</td>
              <td class="col-change text-center" :class="{ 'text-green': item.change < 0, 'text-orange': item.change > 0 }">
                {{ item.formattedChange }}
              </td>
              <td class="col-actions text-center">
                <div class="actions-wrapper">
                  <el-button link type="primary" class="action-icon-btn" title="Edit" @click="$emit('edit', item)">
                    <el-icon :size="15"><Edit /></el-icon>
                  </el-button>
                  <el-button link type="danger" class="action-icon-btn" title="Delete" @click="$emit('delete', item.id)">
                    <el-icon :size="15"><Delete /></el-icon>
                  </el-button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate } from '../utils/date.js';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

const props = defineProps({
  type: { type: String, required: true },
  title: { type: String, required: true },
  unit: { type: String, required: true },
  icon: { type: String, default: '📏' },
  history: { type: Array, default: () => [] }
});

defineEmits(['add', 'edit', 'delete']);

const latest = computed(() => props.history.length > 0 ? props.history[0] : null);
const starting = computed(() => {
  if (props.history.length === 0) return null;
  const initial = props.history.find(h => h.isInitial);
  return initial || props.history[props.history.length - 1];
});

const totalChange = computed(() => {
  if (!latest.value || !starting.value) return 0;
  return Number((latest.value.value - starting.value.value).toFixed(1));
});

const formattedDate = computed(() => latest.value ? formatDate(latest.value.measurementDate) : 'Never');

function formatVal(val) {
  if (val === undefined || val === null) return '—';
  return `${val} ${props.unit}`;
}

function formatChange(val) {
  if (!val) return '0 ' + props.unit;
  const sign = val > 0 ? '+' : '';
  return `${sign}${val} ${props.unit}`;
}

const computedHistory = computed(() => {
  const sortedAsc = [...props.history].sort((a, b) => a.measurementDate.localeCompare(b.measurementDate));
  
  return props.history.map((item) => {
    const idxInAsc = sortedAsc.findIndex(x => x.id === item.id);
    let change = 0;
    if (idxInAsc > 0) {
      change = Number((item.value - sortedAsc[idxInAsc - 1].value).toFixed(1));
    }

    const sign = change > 0 ? '+' : '';
    const formattedChange = idxInAsc === 0 ? '—' : `${sign}${change} ${props.unit}`;

    return {
      ...item,
      formattedDate: formatDate(item.measurementDate),
      formattedValue: `${item.value} ${props.unit}`,
      change,
      formattedChange
    };
  });
});
</script>

<style lang="scss" scoped>
.measurement-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;

    .type-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .icon {
        font-size: 1.75rem;
      }

      .title-group {
        display: flex;
        flex-direction: column;

        .metric-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .latest-date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
      }
    }
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    background: var(--color-bg-app);
    padding: 0.75rem;
    border-radius: var(--radius-md);

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-family: var(--font-heading);
        font-weight: 800;
        font-size: 1.25rem;
        color: var(--color-text-main);
      }

      .stat-label {
        font-size: 0.7rem;
        color: var(--color-text-muted);
        text-transform: uppercase;
        font-weight: 600;
      }

      &.is-loss .stat-value { color: #10b981; }
      &.is-gain .stat-value { color: #f59e0b; }
    }
  }

  .history-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .history-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .empty-history {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      padding: 1rem 0;
      text-align: center;
    }

    .table-wrapper {
      overflow-x: auto;

      .history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8rem;

        th, td {
          padding: 0.4rem 0.2rem;
          border-bottom: 1px dashed var(--color-border-subtle);
          vertical-align: middle;
          white-space: nowrap;
        }

        th {
          font-weight: 700;
          color: var(--color-text-muted);
          border-bottom: 1px solid var(--color-border);
          font-size: 0.725rem;
          text-transform: uppercase;
        }

        .col-date { width: 40%; text-align: left; }
        .col-val { width: 22%; text-align: center; }
        .col-change { width: 19%; text-align: center; }
        .col-actions { width: 19%; text-align: center; }

        .date-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;

          .date-text {
            color: var(--color-text-main);
          }

          .initial-tag {
            font-size: 0.625rem;
            padding: 0 4px;
            height: 18px;
            line-height: 16px;
          }
        }

        .actions-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;

          .action-icon-btn {
            padding: 2px 4px !important;
            margin-left: 0 !important;
            height: auto;

            &:hover {
              opacity: 0.8;
            }
          }
        }
      }
    }
  }

  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .text-green { color: #10b981; font-weight: 600; }
  .text-orange { color: #f59e0b; font-weight: 600; }
}
</style>
