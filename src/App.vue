<script setup>
import { ref, onMounted } from 'vue';

const isReady = ref(false);

onMounted(() => {
  // 修正这里：将 .ref 改为 .value
  setTimeout(() => {
    isReady.value = true; 
  }, 100);
});
</script>

<template>
  <!-- 这里的逻辑没问题，只要上面的 value 变了，这里就会触发淡入 -->
  <div :class="['app-wrapper', { 'is-ready': isReady }]">
    <router-view v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style scoped>
.app-wrapper {
  opacity: 0;
  transition: opacity 1s ease-in-out;
  width: 100%;
  height: 100%;
}

.app-wrapper.is-ready {
  opacity: 1;
}
</style>
