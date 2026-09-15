<template>
  <Analytics />
  <div class="app-layout" :class="{ 'auth-layout': isAuthRoute }">
    <!-- Top Mobile Navigation Bar -->
    <header v-if="!isAuthRoute" class="mobile-navbar">
      <button class="menu-toggle-btn" @click="mobileSidebarOpen = !mobileSidebarOpen">
        <el-icon size="24"><Menu /></el-icon>
      </button>
      <div class="mobile-logo">🏋️‍♂️ GymTracker</div>
      <router-link to="/workout/new" class="mobile-add-btn">
        <el-icon size="20"><Plus /></el-icon>
      </router-link>
    </header>

    <!-- Sidebar component -->
    <AppSidebar 
      v-if="!isAuthRoute" 
      :is-open="mobileSidebarOpen" 
      @close-mobile="mobileSidebarOpen = false" 
    />

    <!-- Main Content Container -->
    <main class="main-content" :class="{ 'full-width': isAuthRoute }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Analytics } from '@vercel/analytics/vue';
import AppSidebar from './components/AppSidebar.vue';
import { Menu, Plus } from '@element-plus/icons-vue';

const route = useRoute();
const mobileSidebarOpen = ref(false);

const isAuthRoute = computed(() => {
  return ['login', 'register', 'setup'].includes(route.name);
});
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  background-color: var(--color-bg-app);

  .mobile-navbar {
    display: none;
    height: 60px;
    background-color: var(--color-bg-sidebar);
    color: #ffffff;
    padding: 0 1rem;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;

    .menu-toggle-btn {
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    .mobile-logo {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 1.15rem;
    }

    .mobile-add-btn {
      width: 36px;
      height: 36px;
      background: var(--color-primary);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }
  }

  .main-content {
    flex: 1;
    margin-left: 280px;
    padding: 2rem;
    min-height: 100vh;
    transition: margin-left 0.3s ease;

    &.full-width {
      margin-left: 0;
      padding: 0;
    }
  }
}

@media (max-width: 1024px) {
  .app-layout {
    .mobile-navbar {
      display: flex;
    }

    .main-content {
      margin-left: 0;
      padding-top: 80px;
    }
  }
}
</style>
