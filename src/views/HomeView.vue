<script>
export default {
  name: 'HomeView'
}
</script>

<script setup>
import { onMounted, onActivated, onDeactivated, ref, defineAsyncComponent } from 'vue';
import Header from '@/components/Header.vue';

// === 保持性能优化：异步引入非首屏组件 ===
const CharacterInfo = defineAsyncComponent(() => import('@/components/CharacterInfo.vue'));
const MusicPlayer = defineAsyncComponent(() => import('@/components/MusicPlayer.vue'));
const Photos = defineAsyncComponent(() => import('../components/Photos.vue'));
const About = defineAsyncComponent(() => import('@/components/About.vue'));

const scrollContainer = ref(null);
const activeSection = ref('section1');
const bgVideoRef = ref(null); // 新增：主页背景视频引用

// 导航点击处理
const handleNavClick = (to) => {
  const sectionId = to.replace('#', '');
  const target = document.getElementById(sectionId);
  if (target && scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: target.offsetTop,
      behavior: 'smooth'
    });
  }
};

// 新增：尝试播放背景视频，忽略被浏览器策略拒绝的 Promise 报错
const tryPlayVideo = () => {
  const video = bgVideoRef.value;
  if (video && video.paused) {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 浏览器暂时拒绝播放（如自动播放策略），静默忽略即可
      });
    }
  }
};

onMounted(() => {
  const options = {
    root: scrollContainer.value, 
    rootMargin: "-40% 0px -60% 0px", 
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id;
      }
    });
  }, options);

  document.querySelectorAll('.scroll-page').forEach(section => {
    observer.observe(section);
  });

  // 首次挂载保险：确保视频处于播放状态
  tryPlayVideo();
});

// 新增：从登录页返回时（keep-alive 重新激活），主动恢复播放
onActivated(() => {
  tryPlayVideo();
});

// 新增：切到登录页时可选择暂停，节省资源
onDeactivated(() => {
  const video = bgVideoRef.value;
  if (video && !video.paused) {
    video.pause();
  }
});
</script>

<template>
  <div class="header-container">
    <Header :active-section="activeSection" @nav-click="handleNavClick" />
  </div>
  
  <div class="scroll-container" ref="scrollContainer">
    <!-- 第一页：主页 -->
    <section id="section1" class="scroll-page">
      <div class="video-background-container">
        <!-- 保持性能优化：海报图优先 -->
        <video 
          ref="bgVideoRef"
          autoplay 
          loop 
          muted 
          playsinline 
          class="video-background" 
          poster="/assets/videos/video_poster.webp" 
          preload="metadata"
          fetchpriority="high"
        >
          <source src="/assets/videos/video_和服.mp4" type="video/mp4" />
          视频加载失败
        </video>
      </div>
      <div class="title-container">
        <!-- 保持性能优化：Logo 优先加载 -->
        <img 
          src="/assets/images/logo_movie_cn.png" 
          alt="Bocchi the Rock Logo"
          fetchpriority="high"
          decoding="async"
        />
      </div>
    </section>

    <!-- 其他页面 -->
    <section id="section2" class="scroll-page"><CharacterInfo /></section>
    <section id="section3" class="scroll-page"><MusicPlayer /></section>
    <section id="section4" class="scroll-page"><Photos/></section>
    <section id="section5" class="scroll-page"><About/></section>
  </div>
</template>

<style scoped>
.header-container { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; }

.scroll-container {
  height: 100vh;
  width: 100vw;
  overflow-y: scroll; 
  scroll-behavior: smooth;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #141414;
  
  scroll-snap-type: y mandatory;
  
  /* 隐藏滚动条 */
  scrollbar-width: none; 
}

/* 隐藏 Chrome/Safari/Edge 的滚动条 */
.scroll-container::-webkit-scrollbar {
  display: none;
}

.scroll-page { 
  padding-top: 80px; 
  height: 100vh; 
  width: 100%; 
  scroll-snap-align: start; 
  scroll-snap-stop: always; 
  position: relative; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  overflow: hidden; 
}

.video-background-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; background: url('/assets/images/LoginImage1.jpg') no-repeat center center/cover; }
.video-background { position: absolute; top: 50%; left: 50%; width: 100vw; height: 100vh; transform: translate(-50%, -50%); object-fit: cover; }
.content { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; }
.title-container { position: absolute; top: 50%; left: 50%; z-index: 2; text-align: center; transform: translateY(-40px); }
.title-container img { animation: spinAndLand 2s ease-out forwards; opacity: 0; width: 80vw; max-width: 500px; }

@keyframes spinAndLand { 0% { opacity: 0.5; transform: translate(100%, -100%) scale(2) rotate(1300deg); } 80% { transform: translate(-50%, -90%) scale(1.5) rotate(0); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); } }

@media (min-width: 768px) { .video-background-container { background: none; } }
@media (max-width: 767px) { .video-background { display: none; } }
</style>
