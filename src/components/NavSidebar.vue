<script setup lang="ts">
import { useRoute } from 'vue-router'

const expanded = defineModel<boolean>('expanded', { default: false })
const route = useRoute()
</script>

<template>
  <nav class="nav-sidebar" :class="{ expanded }">

    <!-- ── Toggle ──────────────────────────────── -->
    <button
      class="sidebar-btn"
      @click="expanded = !expanded"
      :title="expanded ? 'Réduire' : 'Étendre'"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path v-if="!expanded" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        <path v-else           d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
      <span class="label">Menu</span>
    </button>

    <div class="separator" />

    <!-- ── Navigation routes ───────────────────── -->
    <RouterLink to="/"             class="sidebar-btn nav-link" :class="{ active: route.path === '/' }"             :title="expanded ? '' : 'Tablature selon le Mode'">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
      <span class="label">Modes</span>
    </RouterLink>

    <RouterLink to="/chords"       class="sidebar-btn nav-link" :class="{ active: route.path === '/chords' }"       :title="expanded ? '' : 'Description des Accords'">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/></svg>
      <span class="label">Accords</span>
    </RouterLink>

    <RouterLink to="/progressions" class="sidebar-btn nav-link" :class="{ active: route.path === '/progressions' }" :title="expanded ? '' : 'Progressions'">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 8h4v8H4zm5 2h4v4H9zm5-3h4v10h-4z"/></svg>
      <span class="label">Progressions</span>
    </RouterLink>

    <RouterLink to="/tablature"    class="sidebar-btn nav-link" :class="{ active: route.path === '/tablature' }"    :title="expanded ? '' : 'Tablature'">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>
      <span class="label">Tablature</span>
    </RouterLink>


  </nav>
</template>

<style scoped lang="scss">
$w-collapsed: 52px;
$w-expanded:  188px;
$dur:         0.22s;
$ease:        ease;
$item-mx:     6px;
$item-px:     9px;
$item-h:      38px;
$icon-size:   20px;

.nav-sidebar {
  position: relative;
  z-index: 1000;
  width: $w-collapsed;
  min-width: $w-collapsed;
  height: 100%;
  background-color: #141414;
  border-right: 1px solid #252525;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 12px;
  gap: 2px;
  overflow: hidden;
  transition: width $dur $ease, min-width $dur $ease;
  flex-shrink: 0;

  &.expanded {
    width: $w-expanded;
    min-width: $w-expanded;
  }
}

.separator {
  width: calc(100% - $item-mx * 2);
  height: 1px;
  background-color: #252525;
  margin: 4px $item-mx;
  flex-shrink: 0;
}

// ── Base style shared by all sidebar buttons ────
.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  height: $item-h;
  width: calc($w-collapsed - $item-mx * 2);
  min-width: calc($w-collapsed - $item-mx * 2);
  padding: 0 $item-px;
  margin: 1px $item-mx;
  border-radius: 6px;
  border: none;
  background: none;
  color: #777;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    background-color 0.15s,
    color 0.15s,
    width $dur $ease,
    min-width $dur $ease;

  svg { flex-shrink: 0; width: $icon-size; height: $icon-size; }

  .label {
    font-size: 0.82rem;
    font-weight: 500;
    opacity: 0;
    transition: opacity $dur $ease;
    overflow: hidden;
  }

  &:hover {
    background-color: #252525;
    color: #ccc;
  }
}

// ── Route navigation links — orange active ──────
.nav-link.active {
  background-color: #e57c00;
  color: #fff;
}

// ── Expanded state — widen buttons + show labels ─
.nav-sidebar.expanded .sidebar-btn {
  width: calc($w-expanded - $item-mx * 2);
  min-width: calc($w-expanded - $item-mx * 2);

  .label { opacity: 1; }
}
</style>
