<template>
  <div class="user-profile-card">
    <div class="user-info">
      <div class="avatar-badge" :style="{ backgroundColor: user?.avatarColor || '#10B981' }">
        {{ initials }}
      </div>
      <div class="user-details">
        <div class="user-name" :title="user?.name">{{ user?.name || 'User' }}</div>
        <div class="user-email" :title="user?.email">{{ user?.email || '' }}</div>
        <div class="user-stats" v-if="totalWorkouts !== undefined">
          <span>💪 {{ totalWorkouts }} Workouts</span>
        </div>
      </div>
    </div>
    <el-button 
      type="danger" 
      plain 
      size="default" 
      class="logout-btn" 
      @click="handleLogout"
      :loading="loading"
    >
      <el-icon><SwitchButton /></el-icon>
      <span class="logout-text">Logout</span>
    </el-button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { SwitchButton } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  user: Object,
  totalWorkouts: Number
});

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const initials = computed(() => {
  if (!props.user?.name) return 'GT';
  const parts = props.user.name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return props.user.name.substring(0, 2).toUpperCase();
});

const handleLogout = async () => {
  loading.value = true;
  try {
    await authStore.logout();
    ElMessage.success('Logged out successfully');
    router.push({ name: 'login' });
  } catch (e) {
    ElMessage.error('Logout failed');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.user-profile-card {
  padding: 0.85rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .avatar-badge {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      min-width: 0;

      .user-name {
        font-weight: 700;
        font-size: 0.9rem;
        color: #f8fafc;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .user-email {
        font-size: 0.75rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      }

      .user-stats {
        font-size: 0.7rem;
        color: #10b981;
        font-weight: 600;
        margin-top: 2px;
      }
    }
  }

  .logout-btn {
    width: 100%;
    margin-left: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-weight: 600;
  }
}
</style>
