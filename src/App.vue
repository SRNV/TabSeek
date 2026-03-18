<script setup lang="ts">
import TabSVGOverlay from './components/tab/TabSVGOverlay.vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<template>
  <TabSVGOverlay />
  <div class="app" :class="{ 'no-sidebar': !route.matched[0]?.components?.side2 }">
    <nav class="title">
      <RouterLink
        v-for="route in router.getRoutes()"
        :key="route.path"
        :to="route.path"
        class="nav-tab"
        :class="{ active: $route.path === route.path }"
      >
        {{ route.name }}
      </RouterLink>
    </nav>
    <div class="menu">
      <RouterView name="side1"></RouterView>
    </div>
    <div class="sidebar">
      <RouterView name="side2"></RouterView>
      <RouterView name="side3"></RouterView>
    </div>
    <div class="main">
      <RouterView></RouterView>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: grid;
  grid-template-areas:
    "me s t t"
    "me s m m";
  grid-template-columns: 1fr 5fr 9fr 1fr;
  grid-template-rows: 1fr 51fr;
  gap: 10px;

  .sidebar {
    grid-area: s;
    gap: 0px;
    display: flex;
  }

  .menu {
    grid-area: me;
  }

  .main {
    grid-area: m;
  }

  &.no-sidebar {
    grid-template-areas:
      "me t t t"
      "me m m m";
    grid-template-columns: auto 1fr 1fr 1fr;

    .sidebar {
      display: none;
    }
  }

  .title {
    grid-area: t;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;

    .nav-tab {
      padding: 6px 14px;
      font-size: 0.85rem;
      background-color: #444;
      color: #999;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s, transform 0.1s;
      white-space: nowrap;

      &:hover {
        background-color: #555;
        color: #ddd;
      }

      &:active {
        transform: scale(0.95);
      }

      &.active {
        background-color: orange;
        color: white;
        border-color: darkorange;
      }
    }
  }
}
</style>
