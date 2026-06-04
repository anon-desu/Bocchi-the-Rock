<template>
  <div class="not-found-container">
    <iframe ref="errorFrame" src="/cf_404.html" frameborder="0" width="100%" height="100%"></iframe>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  mounted() {
    const iframe = this.$refs.errorFrame;
    if (iframe) {
      // 1. 监听 iframe 加载完成事件
      iframe.onload = () => {
        this.sendPathToIframe();
      };
      
      // 2. 双重保险：如果 iframe 缓存严重或加载极快，onload 可能已错过
      // 延迟一小段时间再发一次，确保 iframe 内的 JS 已准备好接收
      setTimeout(() => {
        this.sendPathToIframe();
      }, 500);
    }
  },
  methods: {
    sendPathToIframe() {
      const iframe = this.$refs.errorFrame;
      if (iframe && iframe.contentWindow) {
        try {
          // 获取浏览器地址栏的真实路径 (例如 /18)
          const currentPath = window.location.pathname;
          
          iframe.contentWindow.postMessage({
            type: 'UPDATE_PATH',
            path: currentPath
          }, '*');
        } catch (e) {
          console.warn('无法向 iframe 传递路径信息:', e);
        }
      }
    }
  }
}
</script>

<style scoped>
.not-found-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #fcfcfc;
}

iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
