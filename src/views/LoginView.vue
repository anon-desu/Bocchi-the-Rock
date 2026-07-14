<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { userStore } from '../store/user';
import { API_BASE_URL } from '../utils/api';

const CAPTCHA_UI_DOMAIN = 'https://bangcaptcha.19216891.xyz'; 

const isLoading = ref(false);
const showCaptcha = ref(false);
const router = useRouter()
const route = useRoute()

// 存储验证凭证
const verifiedCaptchaData = ref(null);

// --- 回滚：恢复原本的3张图片配置 ---
const originalImages = [
    { url: '/assets/images/LoginImage1.jpg' },
    { url: '/assets/images/LoginImage2.jpg' },
    { url: '/assets/images/LoginImage3.jpg' },
]
const extendedImages = ref([
    originalImages[originalImages.length - 1],
    ...originalImages,
    originalImages[0]
])
const containerRef = ref(null)
const currentImageIndex = ref(1)
const isRegister = ref(false)
const FormModel = ref({ username: '', password: '', RePassword: '' })

// 核心：处理 PostMessage 消息
const handleMessage = (event) => {
    if (!event.data || typeof event.data !== 'object') {
        return;
    }

    const allowedDomains = [
        'https://bangcaptcha.19216891.xyz',
        'https://band.19216891.xyz',
        'http://localhost:5173', 
        'http://localhost:3000'
    ];
    
    if (!allowedDomains.includes(event.origin)) { 
        return; 
    }

    if (event.data.type === 'CAPTCHA_RESULT') {
        const { captchaId, selectedIndexes } = event.data.payload;
        
        if (!captchaId || !selectedIndexes) {
            alert("验证数据异常，请刷新重试");
            return;
        }
        
        verifiedCaptchaData.value = { captchaId, selectedIndexes };
        showCaptcha.value = false;
    }
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    requestAnimationFrame(() => {
        if(mainRef.value) {
            mainRef.value.style.transition = 'opacity 1s ease'
            mainRef.value.style.opacity = 1
        }
    })
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});

// 表单提交入口
const submitForm = async () => {
    if (isLoading.value) return;

    if (!FormModel.value.username || !FormModel.value.password) {
        alert('用户名和密码不能为空！'); return; 
    }
    if (FormModel.value.username.length > 20) {
        alert('用户名长度不能超过 20 个字符！'); return;
    }

    if (isRegister.value) {
        // 已移除：密码长度少于 8 位的限制校验
        if (FormModel.value.password !== FormModel.value.RePassword) {
            alert('两次输入的密码不一致！'); return;
        }

        if (verifiedCaptchaData.value) {
            await performRegister(
                verifiedCaptchaData.value.captchaId, 
                verifiedCaptchaData.value.selectedIndexes
            );
        } else {
            showCaptcha.value = true;
        }
        return; 
    }

    await performLogin();
}

const performRegister = async (captchaId, selectedIndexes) => {
    try {
        isLoading.value = true;
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: FormModel.value.username,
                password: FormModel.value.password,
                captchaId: captchaId,
                selectedIndexes: selectedIndexes
            })
        });

        const data = await response.json();
        if (!response.ok) {
            let errorMsg = data.error || '注册失败';
            if (errorMsg.includes('Username exists')) errorMsg = '该用户名已被占用，请换一个试试';
            else if (errorMsg.includes('Too fast')) errorMsg = '操作太快了，请稍等片刻再试';
            else if (errorMsg.includes('Captcha')) errorMsg = '验证码已过期，请重新验证';
            throw new Error(errorMsg);
        }

        alert('注册成功！请登录。');
        isRegister.value = false;
        FormModel.value.password = '';
        FormModel.value.RePassword = '';
        verifiedCaptchaData.value = null;
        
    } catch (error) {
        verifiedCaptchaData.value = null;
        setTimeout(() => {
            alert(error.message + '\n(请重新进行验证)');
        }, 100);
    } finally {
        isLoading.value = false;
    }
}

const performLogin = async () => {
    try {
        isLoading.value = true;
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: FormModel.value.username,
                password: FormModel.value.password
            })
        });
        
        const data = await response.json();
        if (response.status === 429) throw new Error('操作太快了，歇会儿吧！');
        if (!response.ok) {
            let errorMsg = data.error || '登录失败';
            if (errorMsg === 'Auth failed') {
                errorMsg = '账号或密码错误';
            }
            throw new Error(errorMsg);
        }

        userStore.login(data.user, data.accessToken, data.refreshToken);
        goBack();
    } catch (error) {
        alert(error.message);
    } finally {
        isLoading.value = false;
    }
}

const targetImage = [
    { url: '/assets/images/target-image1.png' }, { url: '/assets/images/target-image2.png' },
    { url: '/assets/images/target-image3.png' }, { url: '/assets/images/target-image4.png' },
    { url: '/assets/images/target-image5.png' }, { url: '/assets/images/target-image6.png' },
]
const targetImageIndex = ref(0);
const isAnimating = ref(false);

const Switch = () => {
    isRegister.value = !isRegister.value;
    targetImageIndex.value = (targetImageIndex.value + 2) % (targetImage.length - 1);
    verifiedCaptchaData.value = null;
}

const handleImageSwitch = (increment) => {
    if (isAnimating.value) return;
    isAnimating.value = true;
    currentImageIndex.value += increment;
    const isBoundary = increment > 0 ? currentImageIndex.value === extendedImages.value.length - 1 : currentImageIndex.value === 0;
    if (isBoundary) {
        setTimeout(() => {
            if(containerRef.value) {
                containerRef.value.classList.add('no-transition');
                currentImageIndex.value = increment > 0 ? 1 : extendedImages.value.length - 2;
                requestAnimationFrame(() => {
                    if(containerRef.value) {
                        containerRef.value.classList.remove('no-transition');
                        isAnimating.value = false;
                    }
                });
            }
        }, 500);
    } else { 
        setTimeout(() => { isAnimating.value = false; }, 500); 
    }
}

const RightImage = () => handleImageSwitch(1);
const LeftImage = () => handleImageSwitch(-1);
const mainRef = ref(null)

const goBack = () => {
    const redirectUrl = route.query.redirect;
    if (redirectUrl && redirectUrl !== '/login') router.push(redirectUrl);
    else router.push('/');
}

const goHome = () => goBack();

const closeCaptcha = () => {
    showCaptcha.value = false;
    verifiedCaptchaData.value = null;
}
</script>

<template>
    <div class="main" ref="mainRef">
        <!-- 人机验证 Overlay -->
        <Transition name="captcha-fade">
            <div v-if="showCaptcha" class="captcha-overlay" @click.self="closeCaptcha">
                <div class="captcha-modal">
                    <!-- 安全验证框架 -->
                    <div class="iframe-container">
                        <div class="captcha-header">
                            <div class="captcha-header-left">
                                <Icon icon="material-symbols:shield-lock-outline-rounded" class="header-icon" />
                                <span class="header-title">安全验证</span>
                            </div>
                            <!-- 移入顶栏右侧的关闭按钮，改用 div 彻底避免样式冲突 -->
                            <div class="captcha-close" @click="closeCaptcha" role="button" aria-label="关闭验证">
                                <Icon icon="material-symbols:close-rounded" />
                            </div>
                        </div>
                        <iframe :src="CAPTCHA_UI_DOMAIN" title="安全验证" scrolling="no"></iframe>
                    </div>
                </div>
            </div>
        </Transition>

        <div class="background-container"
            :style="{ left: `-${currentImageIndex * 100}%`, '--background-width': extendedImages.length * 100 + '%' }"
            ref="containerRef">
            <div v-for="(img, index) in extendedImages" :key="index" class="main-background" :style="{
                backgroundImage: `url('${img.url}')`
            }"></div>
        </div>

        <Icon class="left" icon="material-symbols:arrow-back-ios-new-rounded" @click="LeftImage" />
        <Icon class="right" icon="material-symbols:arrow-forward-ios-rounded" @click="RightImage" />
        
        <div class="box">
            <div class="target">
                <Transition name="fade">
                    <div class="slide-image-container" :class="{ 'slide': isRegister }" :key="currentImageIndex">
                        <img class="slide-image" :src="extendedImages[currentImageIndex].url" :key="currentImageIndex">
                    </div>
                </Transition>
                <Transition name="fade">
                    <img class="target-image-1" :src="targetImage[targetImageIndex].url" alt="">
                </Transition>
                <Transition name="fade">
                    <img class="target-image-2" :src="targetImage[targetImageIndex + 1].url" alt="">
                </Transition>
            </div>
            
            <div class="targetbox"></div>

            <div class="loginbox">
                <form @submit.prevent="submitForm">
                    <Transition name="form-fade" mode="out-in">
                        <h2 :key="!isRegister">{{ !isRegister ? 'Log In' : 'Join Us' }}</h2>
                    </Transition>

                    <label class="input-name">Username:</label>
                    <input v-model="FormModel.username" required maxlength="20"></input>
                    
                    <label class="input-name">Password:</label>
                    <input type="password" v-model="FormModel.password" required></input>
                    
                    <div class="repassword-container">
                        <Transition name="form-fade" mode="out-in">
                            <div v-if="isRegister" class="repassword-content">
                                <label class="input-name">RePassword:</label>
                                <input type="password" v-model="FormModel.RePassword" required></input>
                            </div>
                        </Transition>
                    </div>
                    
                    <Transition name="form-fade" mode="out-in">
                        <button type="submit" 
                                :key="!isRegister" 
                                :disabled="isLoading"
                                :class="{ 'verified-btn': verifiedCaptchaData && isRegister }">
                            {{ 
                                isLoading ? 'Processing...' : 
                                (!isRegister ? 'Login' : 
                                (verifiedCaptchaData ? '验证通过 ✓ 点击注册' : 'Register')) 
                            }}
                        </button>
                    </Transition>
                </form>

                <div class="switch-prompt" @click="Switch">
                    <Transition name="form-fade" mode="out-in">
                        <p v-if="!isRegister" key="to-register">还没有账户？<span class="link">立即注册</span></p>
                        <p v-else key="to-login">已有账户？<span class="link">立即登录</span></p>
                    </Transition>
                </div>
            </div>
            
            <img class="switch-login" src="/assets/images/电吉他.svg" alt="切换模式" @click="Switch"></img>
            <div class="ribbons"></div>
        </div>
        <Icon class="close-login" icon="material-symbols:close-rounded" @click="goHome" />
    </div>
</template>

<style scoped>
/* ==========================================================================
   人机验证 Modernized Style 
   ========================================================================== */
.captcha-overlay { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100vw; 
    height: 100vh; 
    background: rgba(15, 23, 42, 0.35); /* 优雅深色微透背景 */
    backdrop-filter: blur(8px); /* 强化磨砂模糊 */
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    padding: 20px; 
    box-sizing: border-box; 
}

.captcha-modal { 
    background: transparent;
    position: relative; 
    width: 380px; 
    max-width: 90vw; 
    height: 540px; /* 调整高度以适配顶栏 */
    max-height: 85vh; 
    display: flex; 
    flex-direction: column; 
    overflow: visible !important; 
    /* 多层拟物阴影，带来精致立体感 */
    box-shadow: 
        0 20px 50px -12px rgba(0, 0, 0, 0.25),
        0 10px 20px -15px rgba(236, 64, 122, 0.15); 
    border-radius: 16px; /* 更为圆润 */
}

.iframe-container {
    width: 100%; 
    height: 100%;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden; 
    position: relative;
    z-index: 1; 
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 精致页眉 */
.captcha-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    user-select: none;
}

.captcha-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.captcha-header .header-icon {
    font-size: 20px;
    color: #ec407a; /* 沿用页面主题粉色 */
}

.captcha-header .header-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b; /* 现代Slate深灰色 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.captcha-modal iframe { 
    flex: 1;
    width: 100%; 
    border: none; 
    display: block; 
}

/* 现代化内嵌式关闭按钮 (已改为 div，完全规避全局 button 样式继承) */
.captcha-close { 
    width: 32px; 
    height: 32px; 
    background: rgba(0, 0, 0, 0.05); 
    color: #64748b; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    box-sizing: border-box;
    transition: background-color 0.2s ease, color 0.2s ease;
}

/* 仅在悬停或激活时产生颜色渐变，无任何缩放/旋转 */
.captcha-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #ec407a;
}

/* 保证图标尺寸精准不拉伸 */
.captcha-close :deep(svg),
.captcha-close svg {
    width: 18px !important;
    height: 18px !important;
}

/* 优雅的弹性进出转场动效 */
.captcha-fade-enter-active, 
.captcha-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.captcha-fade-enter-from, 
.captcha-fade-leave-to {
    opacity: 0;
}

.captcha-fade-enter-active .captcha-modal {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.captcha-fade-leave-active .captcha-modal {
    transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.25s ease;
}

.captcha-fade-enter-from .captcha-modal {
    transform: scale(0.9) translateY(15px);
    opacity: 0;
}

.captcha-fade-leave-to .captcha-modal {
    transform: scale(0.95) translateY(5px);
    opacity: 0;
}

@media (max-width: 480px) { 
    .captcha-modal { 
        height: 500px; /* 移动端高度微调 */
    } 
}

/* ==========================================================================
   原有布局与基础页面样式 
   ========================================================================== */
.main { 
    display: flex; align-items: center; justify-content: center; 
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
    opacity: 0; transition: opacity 1s ease; 
    overflow: hidden; /* 防止页面被拖动 */
}

.background-container { will-change: left; position: absolute; display: flex; width: var(--background-width); height: 100%; transition: left 0.5s ease-in-out; z-index: 0; }
.background-container.no-transition { transition: none; }
.main-background { width: 100vw; height: 100vh; background-size: cover; background-position: center bottom; flex-shrink: 0; }
.main-background::before { left: 0; top: 0; width: 100vw; height: 100vh; position: fixed; content: ''; background: linear-gradient(-10deg, rgba(255, 130, 130, 0.05) 50%, rgba(255, 212, 112, 0.05) 100%); backdrop-filter: blur(3px); }
.left, .right { position: fixed; width: 5%; height: 10%; cursor: pointer; transform: scale(1); transition: transform 0.5s ease; color: #ffffff61; }
.left:hover, .right:hover { transform: scale(1.3); }
.left { left: 30px; } .right { right: 30px; }

.box { position: relative; display: flex; align-items: center; width: 50%; height: 60%; z-index: 1; outline: 1.5px dashed #000; outline-offset: -20px; }

.target { position: absolute; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 10px 0; box-sizing: border-box; height: 100%; left: 10px; top: 0; width: 30%; z-index: 2; background-color: #ffecd7; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4); border-radius: 5px; }
.targetbox { width: 25%; height: 95%; background-color: white; outline: 1.5px dashed #000; outline-offset: -8px; }
.slide-image-container { will-change: opacity; position: absolute; width: 100%; height: 50%; top: 10px; transition: all 0.8s ease-in-out; box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.5); z-index: 5; }
.slide-image { width: 100%; height: 100%; object-fit: cover; }
.slide { top: calc(100% - 10px - 50%); }

.target-image-1 { width: 70%; height: auto; object-fit: contain; transition: all 0.8s ease; }
.target-image-2 { width: 70%; height: auto; object-fit: contain; transition: all 0.8s ease; }

.loginbox { width: 73.5%; height: 95%; background-color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.7); position: relative; }
@font-face { font-family: 'Note-Script-SemiBold-2'; src: url('/assets/fonts/Note-Script-SemiBold-2.ttf') format('truetype'); font-style: normal; }
@font-face { font-family: 'Brush-Script-MT'; src: url('/assets/fonts/Brush-Script-MT-Italic.ttf') format('truetype'); font-style: normal; }
form { display: flex; flex-direction: column; align-items: center; width: 100%; }
h2 { font-family: 'Brush-Script-MT'; font-size: 3em; font-weight: bolder; margin-bottom: 20px; }
input { width: 60%; border: none; border-bottom: 1px solid black; font-size: 1.2em; background: transparent; margin-bottom: 10px; }
input:focus { outline: none; box-shadow: none; }

button { 
    background: none; border: none; font-size: 1.4em; width: auto; height: auto; 
    font-family: 'Note-Script-SemiBold-2'; cursor: pointer; margin-top: 20px; 
    transition: all 0.3s ease;
    padding: 5px 10px; 
}
button:focus { outline: none; box-shadow: none; }
button:disabled { cursor: not-allowed; opacity: 0.6; }

button.verified-btn {
    background-color: #ec407a !important;
    color: white !important;
    border-radius: 25px;
    padding: 8px 30px;
    box-shadow: 0 4px 15px rgba(236, 64, 122, 0.4);
    font-size: 1.2em; 
    border: none;
    margin-top: 20px;
}
button.verified-btn:hover {
    background-color: #d81b60 !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(236, 64, 122, 0.6);
}

.input-name { font-family: 'Note-Script-SemiBold-2'; width: 60%; text-align: left; font-size: 20px; }
.repassword-container { height: 70px; width: 100%; display: flex; justify-content: center; flex-direction: column; align-items: center; }
.repassword-content { width: 100%; display: flex; flex-direction: column; align-items: center; }
.switch-prompt { font-size: 14px; color: #888; margin-top: 15px; cursor: pointer; text-align: center; }
.switch-prompt .link { color: #ec407a; text-decoration: underline; font-weight: bold; }
.switch-login { position: absolute; top: 5%; right: 25px; width: 60px; height: auto; z-index: 2; cursor: pointer; transform: scale(1); transition: transform 0.5s ease; }
.switch-login:hover { transform: scale(1.3); }
.close-login { position: absolute; top: 0; right: 0; width: 5%; height: auto; z-index: 4; cursor: pointer; color: #ff3aa0bc; }
.form-fade-enter-active, .form-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.form-fade-enter-from, .form-fade-leave-to { opacity: 0; transform: translateY(10px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) { 
    /* --- 回滚：手机端隐藏箭头和装饰 --- */
    .left, .right, .target, .targetbox, .switch-login, .ribbons { display: none; } 
    
    .box { 
        width: 90vw; 
        height: auto; 
        min-height: 50vh; 
        flex-direction: column; 
        outline: none; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
        border-radius: 10px; 
        background: transparent; 
    } 
    
    .loginbox { 
        width: 100%; 
        height: auto; 
        min-height: 100%;
        padding: 40px 0; 
        box-shadow: none; 
        border-radius: 10px; 
    } 
    
    form { 
        justify-content: center; 
        height: auto; 
    } 
    
    input, .input-name { width: 80%; } 
    
    h2 { 
        font-size: 2.5em; 
        position: static; 
        margin-bottom: 25px; 
        margin-top: 10px;
    } 
    
    button { 
        position: static; 
        margin-top: 25px; 
        padding: 12px 30px; 
        background-color: #ff3aa0bc; 
        color: white; 
        border-radius: 8px; 
        font-size: 1.2em; 
    }
    
    button.verified-btn {
        background-color: #ec407a !important;
        margin-top: 25px;
        width: auto;
    }
    
    .switch-prompt { display: block; margin-top: 30px; margin-bottom: 10px; } 
    .close-login { width: 30px; height: 30px; top: 15px; right: 15px; } 
}
</style>
