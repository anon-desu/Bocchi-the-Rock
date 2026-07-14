<script setup>
// 1. 原始静态图片列表 (共23张)
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

// 2. 简易洗牌算法 (Fisher-Yates)，生成一个唯一的随机母体顺序
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const master_list = shuffle(photo_list); // 长度为 23 的随机母表

// 3. 数组循环位移函数 (Rotation)
const rotateArray = (arr, offset) => {
  const k = offset % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

/* 
  4. 使用大跨度错位偏移（分别偏移 0, 8, 16 位）
  因为 23 是质数，偏移量 8 和 16 可以做到：
  - 垂直方向上绝对不会出现重复图片（同一列里的三张图完全不同）
  - 同一张图片在相邻行之间的距离被拉到最大，避免在同一个手机屏幕内挤在一起
*/
const base_1 = master_list;
const base_2 = rotateArray(master_list, 8);
const base_3 = rotateArray(master_list, 16);

// 5. 每行依然复制 4 份（长度均为 92，物理对齐完全不受影响）
const display_list_1 = [...base_1, ...base_1, ...base_1, ...base_1];
const display_list_2 = [...base_2, ...base_2, ...base_2, ...base_2];
const display_list_3 = [...base_3, ...base_3, ...base_3, ...base_3];
</script>

<template>
    <div class="bg">
        <div class="container">
            <div class="scroll-container" v-memo="[display_list_1]">
                <ol class="boxes boxes-forward">
                    <li class="box" v-for="(photo, i) in display_list_1" :key="'r1-'+i">
                        <img :src="photo" loading="lazy" decoding="async" alt="gallery" />
                    </li>
                </ol>
            </div>

            <div class="scroll-container" v-memo="[display_list_2]">
                <ol class="boxes boxes-backward">
                    <li class="box" v-for="(photo, i) in display_list_2" :key="'r2-'+i">
                        <img :src="photo" loading="lazy" decoding="async" alt="gallery" />
                    </li>
                </ol>
            </div>

            <div class="scroll-container" v-memo="[display_list_3]">
                <ol class="boxes boxes-forward">
                    <li class="box" v-for="(photo, i) in display_list_3" :key="'r3-'+i">
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
    overflow: hidden; 
}

.boxes { 
    position: absolute; 
    display: flex; 
    height: 100%; 
    will-change: transform;
    animation: scroll linear infinite; 
    animation-duration: 60s; 
    gap: 3vh; 
    padding-left: 0; 
    margin-top: 0; 
    align-items: center; 
}

.boxes-forward { animation-name: scrollForward; }
.boxes-backward { animation-name: scrollBackward; }

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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); 
    opacity: 0.8; 
    will-change: transform, width;
    transform: perspective(100px) rotateY(-15deg); 
}

.box img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    object-position: center; 
    border-radius: 15px; 
    backface-visibility: hidden; 
}

.box:hover { 
    opacity: 1; 
    z-index: 100; 
    width: 35vh; 
    box-shadow: 0 10px 20px rgba(0,0,0,0.5); 
    transform: scale(1.1) rotateY(0deg); 
}

.boxes:hover { animation-play-state: paused; }

.boxes-backward .box { transform: perspective(100px) rotateY(15deg); }
.boxes-backward .box:hover { transform: scale(1.1) rotateY(0deg); width: 35vh; }

/* --- 移动端适配 --- */
@media (max-width: 1024px) {
    .container { justify-content: center; gap: 10px; }
    .scroll-container { height: 200px; }
    .boxes { gap: 15px; }
    .box { width: 150px; height: 150px; }
    .box:hover,
    .boxes-backward .box:hover { 
        width: 220px; 
        transform: scale(1.1) rotateY(0deg); 
    }
}

@media (max-width: 768px) {
    .scroll-container { height: 150px; }
    .boxes { gap: 10px; }
    .box { width: 120px; height: 120px; }
    .box:hover,
    .boxes-backward .box:hover { 
        width: 200px; 
        transform: scale(1.05) rotateY(0deg); 
    }
}
</style>
