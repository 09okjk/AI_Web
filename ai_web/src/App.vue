<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 应用主组件
</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  background: #f5f7fa;
}

* {
  box-sizing: border-box;
}
</style>