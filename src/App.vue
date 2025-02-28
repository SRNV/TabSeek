<template>
  <div class="app">
    <div class="title">
      <h1>{{ $route.name }}</h1>
    </div>
    <div class="menu">
      <RouterView name="side1"></RouterView>
    </div>
    <div class="sidebar">
      <RouterView name="side2"></RouterView>
      <RouterView name="side3"></RouterView>
    </div>
    <div class="main">
      <RouterView></RouterView>
      <RouterView name="details"></RouterView>
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
  .title {
    grid-area: t;
  }
}
</style>
