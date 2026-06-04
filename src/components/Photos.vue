<script setup>
// 不需要 computed，直接处理静态数据即可
const photo_list = [
  "/assets/images/p_1.jpeg", "/assets/images/p_2.jpeg", "/assets/images/p_3.jpeg", 
  "/assets/images/p_4.gif",  "/assets/images/p_5.jpeg", "/assets/images/p_6.jpeg", 
  "/assets/images/p_7.jpeg", "/assets/images/p_8.jpeg", "/assets/images/p_9.jpeg", 
  "/assets/images/p_10.jpeg", "/assets/images/p_11.jpeg", "/assets/images/p_12.jpeg", 
  "/assets/images/p_13.jpeg", "/assets/images/p_14.jpeg", "/assets/images/p_15.jpeg", 
  "/assets/images/p_16.jpeg", "/assets/images/p_17.gif", "/assets/images/p_18.gif", 
  "/assets/images/p_19.gif", "/assets/images/p_20.gif", "/assets/images/p_21.gif", 
  "/assets/images/p_22.gif", "/assets/images/p_23.jpeg"
];

// 直接生成一份长列表，减少运行时的计算开nw
// 复制 4 份确保宽屏幕下滚动也不会断档
const display_list = [...photo_list, ...photo_list, ...photo_list, ...photo_list];
</script>

<template>
    <div class="bg">
        <div class="container">
            <!-- 
                v-memo: Vue 3.2+ 新特性。
                告诉 Vue："只要 display_list 没变，就不要重新计算这个 DOM 树"。
                这对于这种大量静态列表非常有用，能极大减少内存开销。
            -->
            <div class="scroll-container" v-memo="[display_list]">
                <ol class="boxes boxes-forward">
                    <li class="box" v-for="(photo, i) in display_list" :key="'r1-'+i">
                        <!-- 
                            decoding="async": 关键优化。允许浏览器在后台解码图片，
                            特别是你有 GIF 的时候，能防止滚动卡顿。
                        -->
                        <img :src="photo" loading="lazy" decoding="async" alt="gallery" />
                    </li>
                </ol>
            </div>

            <div class="scroll-container" v-memo="[display_list]">
                <ol class="boxes boxes-backward">
                    <li class="box" v-for="(photo, i) in display_list" :key="'r2-'+i">
                        <img :src="photo" loading="lazy" decoding="async" alt="gallery" />
                    </li>
                </ol>
            </div>

            <div class="scroll-container" v-memo="[display_list]">
                <ol class="boxes boxes-forward">
                    <li class="box" v-for="(photo, i) in display_list" :key="'r3-'+i">
                        <img :src="photo" loading="lazy" decoding="async" alt="gallery" />
                    </li>
                </ol>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bg { 
    position: relative; 
    width: 100%; 
    height: 100%; 
    z-index: 0; 
    /* 背景渐变动画稍微调慢一点，降低 GPU 负载 */
    background: linear-gradient(-45deg, #ff7d996e, #ffc766, #5cb6ff, #ff6363); 
    background-size: 200% 200%; 
    animation: gradient 20s ease infinite; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    overflow: hidden; 
}

@keyframes gradient { 0% { background-position: 0% 0%; } 50% { background-position: 100% 100%; } 100% { background-position: 0% 0%; } }

.container { 
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly; 
    padding: 2vh 0;
    box-sizing: border-box;
}

.scroll-container { 
    position: relative; 
    width: 100%; 
    height: 30vh; 
    display: flex;
    align-items: center; 
    /* 防止子元素溢出导致的布局抖动 */
    overflow: hidden; 
}

.boxes { 
    position: absolute; 
    display: flex; 
    height: 100%; 
    /* === [核心优化] GPU 加速 === */
    /* 告诉浏览器这个元素的位置会一直变，请把它提升到合成层 */
    will-change: transform;
    
    animation: scroll linear infinite; 
    animation-duration: 60s; /* 稍微调慢一点，看起来更优雅，也更省资源 */
    gap: 3vh; 
    padding-left: 0; 
    margin-top: 0; 
    align-items: center; 
}

.boxes-forward { animation-name: scrollForward; }
.boxes-backward { animation-name: scrollBackward; }

/* 使用 translate3d 强制开启硬件加速 */
@keyframes scrollForward { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
@keyframes scrollBackward { 0% { transform: translate3d(-50%, 0, 0); } 100% { transform: translate3d(0, 0, 0); } }

.box { 
    list-style: none; 
    position: relative; 
    height: 22vh; 
    width: 22vh; 
    flex-shrink: 0; 
    margin-right: 5px; 
    border: none; 
    border-radius: 15px; 
    transition: all 0.5s ease; 
    
    /* 阴影优化：大量的阴影模糊计算很耗性能，稍微减少扩散半径 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); 
    
    opacity: 0.8; 
    /* 3D 变换也需要 will-change */
    will-change: transform, width;
    transform: perspective(100px) rotateY(-15deg); 
}

/* 
   图片本身不要做太复杂的动画，跟随父盒子即可。
   添加 backface-visibility 避免旋转时的闪烁 
*/
.box img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    object-position: center; 
    border-radius: 15px; 
    backface-visibility: hidden; 
}

/* 悬停效果 */
.box:hover { 
    opacity: 1; 
    z-index: 100; 
    width: 35vh; 
    box-shadow: 0 10px 20px rgba(0,0,0,0.5); /* 只有悬停时才用重阴影 */
    transform: scale(1.1) rotateY(0deg); 
}

.boxes:hover { animation-play-state: paused; }

/* 反向行的默认角度 */
.boxes-backward .box { transform: perspective(100px) rotateY(15deg); }
.boxes-backward .box:hover { transform: scale(1.1) rotateY(0deg); width: 35vh; }

/* --- 移动端适配 --- */
@media (max-width: 1024px) {
    .container { justify-content: center; gap: 10px; }
    .scroll-container { height: 200px; }
    .boxes { gap: 15px; }
    .box { width: 150px; height: 150px; }
    .box:hover { width: 220px; transform: scale(1.1); }
}

@media (max-width: 768px) {
    .scroll-container { height: 150px; }
    .boxes { gap: 10px; }
    .box { width: 120px; height: 120px; }
    .box:hover { width: 200px; transform: scale(1.05); }
}
</style>
