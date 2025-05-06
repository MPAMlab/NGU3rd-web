<!-- src/views/index.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Import Kinde auth composable
import { useKindeAuth } from '../composables/useKindeAuth'; // Ensure this path is correct

// Import types if needed for userMember display, but not for the main logic here
// import { Member, KindeUser } from '../types'; // <--- Ensure this path is correct

// --- Composable Usage ---
const {
    isAuthenticated,
    kindeUser, // { id, email, name } or null
    userMember, // Member object or null (This is now READONLY from the composable)
    login, // Function to initiate login/register
    logout, // Function to initiate logout
    checkAuthStatus, // Function to check auth status and fetch userMember
    // authenticatedFetch is not needed on this page
    // updateUserMember is not needed on this page
    // handleCallback is handled by KindeCallback.vue
    isAdminUser, // Added to check if user is admin for panel link
} = useKindeAuth();

// useSettings is not needed on this page anymore
// import { useSettings } from '../composables/useSettings';
// const { isCollectionPaused, isFetchingSettings, settingsError, fetchCollectionStatus } = useSettings();


const route = useRoute();
const router = useRouter();

// --- Configuration ---
// API_BASE_URL is not needed on this page
// websiteLink is not needed on this page
// MAX_AVATAR_SIZE_MB is not needed on this page

// --- State Management (Reactive) ---
interface State {
    showLoadingOverlay: boolean; // Global loading for API calls (mainly for initial auth check or logout)
    errorMessage: string | null; // Global error message

    eventInfo: {
        title: string;
        location: string;
        time: string;
        description: string;
        liveLinkPlaceholder: string; // Placeholder for live link
    };
}

const state: State = reactive({
    showLoadingOverlay: false, // Start false, might be set true during auth check
    errorMessage: null,

    eventInfo: {
        title: "NGU 第三届音游娱乐赛",
        location: "翡尔堡家庭娱乐中心(郑州万象城三楼店)",
        time: "2025年5月18日",
        description: "Never ever and ever... 具体规则以及如有变动，请留意群内公告。",
        liveLinkPlaceholder: "/live/1", // Example placeholder live match ID
    }
});

// --- Computed Properties ---
// No complex computed properties needed for steps, progress, etc.

// Computed property to get the display name for the logged-in user
const displayName = computed(() => {
    if (userMember.value) {
        return userMember.value.nickname || userMember.value.name || '用户';
    }
    if (kindeUser.value) {
        return kindeUser.value.given_name || kindeUser.value.email || '用户';
    }
    return '用户';
});


// --- Methods / Functions ---

// Function to initiate Kinde login/register
function initiateLogin(prompt: 'login' | 'create'): void {
    // No context needed for App 2 index page login
    login(prompt);
}

// Function to handle logout
async function handleLogout(): Promise<void> {
    state.showLoadingOverlay = true; // Show loading during logout
    await logout(); // logout composable handles the Kinde redirect and state update
    // Loading will be hidden by the watch on isAuthenticated becoming false
}

// Function to navigate to the live page
function goToLive(): void {
    // Navigate to the live page using the placeholder match ID
    router.push(state.eventInfo.liveLinkPlaceholder);
}

// Function to navigate to the user/admin panel
function goToPanel(): void {
    if (isAdminUser.value) {
        router.push('/admin'); // Go to admin dashboard
    } else {
        router.push('/user/matches'); // Go to user matches page
    }
}


// Background animation function (optional, copy from prototype if desired)
function createTriangleBackground(): void {
    const trianglesContainer = document.getElementById('triangles');
    if (!trianglesContainer) return;

    // Clear existing triangles
    trianglesContainer.innerHTML = '';

    const colors = ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
    const triangleCount = 50; // Adjust count as needed

    for (let i = 0; i < triangleCount; i++) {
        const triangle = document.createElement('div');
        triangle.classList.add('triangle');

        const size = Math.random() * 100 + 50; // Size between 50 and 150

        const left = Math.random() * 100; // Random horizontal position
        const top = Math.random() * 100 + 100; // Start below the viewport

        const color = colors[Math.floor(Math.random() * colors.length)];

        const duration = Math.random() * 30 + 20; // Longer duration
        const delay = Math.random() * 30; // Random delay

        triangle.style.borderLeft = `${size / 2}px solid transparent`;
        triangle.style.borderRight = `${size / 2}px solid transparent`;
        triangle.style.borderBottom = `${size}px solid ${color}`;
        triangle.style.left = `${left}%`;
        triangle.style.top = `${top}vh`; // Use vh for initial position
        triangle.style.animationDuration = `${duration}s`;
        triangle.style.animationDelay = `${delay}s`;

         // Add custom properties for animation keyframes
         const startRotate = Math.random() * 360;
         const endRotate = startRotate + (Math.random() > 0.5 ? 720 : -720); // Rotate multiple times
         triangle.style.setProperty('--start-rotate', `${startRotate}deg`);
         triangle.style.setProperty('--end-rotate', `${endRotate}deg`);
         triangle.style.setProperty('--end-y', '-105vh'); // End above the viewport

        trianglesContainer.appendChild(triangle);

        // Remove element after animation ends (or a bit after delay + duration)
        setTimeout(() => triangle.remove(), (duration + delay) * 1000 + 500);
    }
}


// --- Lifecycle Hooks ---

onMounted(async () => {
    console.log("IndexPage onMounted: Starting auth status check...");
    // Check auth status first. This populates isAuthenticated and userMember.
    // The router guard also does this, but calling it here ensures state is updated
    // immediately when the component mounts, regardless of how the user arrived.
    await checkAuthStatus();
    console.log("IndexPage onMounted: checkAuthStatus completed. isAuthenticated =", isAuthenticated.value, "userMember =", userMember.value);

    // No need to fetch collection status or handle team codes/callbacks on this page.
    // Kinde callback is handled by KindeCallback.vue.
    // Team code logic is in App 1's index page.

    // Start background animation
    createTriangleBackground();
});

onUnmounted(() => {
    // Clear background triangles on unmount
    const trianglesContainer = document.getElementById('triangles');
    if (trianglesContainer) {
        trianglesContainer.innerHTML = '';
    }
});

// Watch for changes in isAuthenticated state to hide loading overlay after logout
watch(isAuthenticated, (newValue, oldValue) => {
    console.log("IndexPage isAuthenticated state changed:", oldValue, "->", newValue);
    if (newValue === false && oldValue === true) {
        // User just logged out
        state.showLoadingOverlay = false; // Hide loading overlay
        state.errorMessage = '您已退出登录。'; // Show logout message
        setTimeout(() => { state.errorMessage = null; }, 3000); // Clear message
    }
     if (newValue === true && oldValue === false) {
         // User just logged in (via callback redirect)
         state.showLoadingOverlay = false; // Hide loading overlay
         // No success message needed here, the user is just logged in.
         // Their next action (go to panel, etc.) is up to them.
     }
});

// Watch for changes in userMember state (less critical on this page, but good practice)
watch(userMember, (newValue, oldValue) => {
     console.log("IndexPage userMember state changed:", oldValue ? 'exists' : 'null', "->", newValue ? 'exists' : 'null');
     // If userMember becomes non-null, it means the user is now registered.
     // On this page, we don't automatically redirect, but the UI will update.
});


</script>

<template>
    <!-- Root container -->
    <div class="bg-gray-900 text-white min-h-screen flex flex-col overflow-y-auto items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative">
         <!-- 动态三角形背景 -->
         <div id="triangles" class="absolute inset-0 z-0 overflow-hidden"></div>

        <!-- Main Content Container -->
        <div class="w-full max-w-md mx-auto relative z-10">

             <!-- Global Error message display area -->
             <transition name="fade-in-up">
                 <div v-if="state.errorMessage && !state.showLoadingOverlay" class="bg-red-600 bg-opacity-90 text-white text-sm p-3 rounded-lg mb-6 shadow-lg flex items-start" role="alert">
                     <img src="https://unpkg.com/lucide-static@latest/icons/circle-alert.svg" class="w-5 h-5 mr-3 text-yellow-300 flex-shrink-0 mt-0.5" alt="Error">
                     <span class="break-words flex-grow">{{ state.errorMessage }}</span>
                    <button type="button" class="ml-2 -mt-1 text-gray-300 hover:text-white transition-colors" @click="state.errorMessage = null" aria-label="关闭错误消息">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
             </transition>

            <!-- Entry Content -->
            <div class="glass rounded-3xl p-8 fade-in">
                <!-- Header -->
                <div class="text-center mb-8">
                     <div class="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                        <img src="/logo.webp" class="w-24 h-24 text-white" alt="NGU3rd Logo"> <!-- Use your actual logo path -->
                    </div>
                    <h1 class="text-3xl font-bold mb-2">{{ state.eventInfo.title }}</h1>
                    <p class="text-purple-300">活动入口</p>
                </div>

                <!-- Event Information -->
                <div class="mb-8 space-y-4 text-sm">
                    <div class="flex items-start">
                        <img src="https://unpkg.com/lucide-static@latest/icons/map-pin.svg" class="w-4 h-4 mr-3 text-purple-300 flex-shrink-0 mt-1" alt="Location">
                        <span class="text-gray-200"><strong class="font-medium text-purple-300">地点:</strong> {{ state.eventInfo.location }}</span>
                    </div>
                    <div class="flex items-start">
                        <img src="https://unpkg.com/lucide-static@latest/icons/clock.svg" class="w-4 h-4 mr-3 text-purple-300 flex-shrink-0 mt-1" alt="Time">
                        <span class="text-gray-200"><strong class="font-medium text-purple-300">时间:</strong> {{ state.eventInfo.time }}</span>
                    </div>
                    <div class="flex items-start">
                         <img src="https://unpkg.com/lucide-static@latest/icons/info.svg" class="w-4 h-4 mr-3 text-purple-300 flex-shrink-0 mt-1" alt="Info">
                        <p class="text-gray-300 leading-relaxed"><strong class="font-medium text-purple-300">简介:</strong> {{ state.eventInfo.description }}</p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-4">
                    <!-- Login/Register Buttons (Show if not authenticated) -->
                    <div v-if="!isAuthenticated" class="text-center">
                        <p class="text-gray-300 text-sm mb-4">请选择登录或注册：</p>
                        <button @click="initiateLogin('login')" :disabled="state.showLoadingOverlay" class="btn-glow w-full bg-blue-700 hover:bg-blue-600 rounded-lg py-3 font-bold transition duration-300 mb-4" :class="{'opacity-50 cursor-not-allowed': state.showLoadingOverlay}">
                            {{ state.showLoadingOverlay ? '加载中...' : '登录' }}
                        </button>
                        <button @click="initiateLogin('create')" :disabled="state.showLoadingOverlay" class="btn-glow w-full bg-teal-700 hover:bg-teal-600 rounded-lg py-3 font-bold transition duration-300" :class="{'opacity-50 cursor-not-allowed': state.showLoadingOverlay}">
                             {{ state.showLoadingOverlay ? '加载中...' : '注册新账号' }}
                        </button>
                    </div>

                    <!-- Authenticated User Options -->
                    <div v-else class="text-center">
                         <p class="text-lg text-green-400 font-semibold mb-4">你好，{{ displayName }}！</p>
                         <p class="text-gray-300 text-sm mb-6">你已登录。</p>

                         <!-- Link to User/Admin Panel -->
                         <button @click="goToPanel()" class="btn-glow w-full bg-purple-700 hover:bg-purple-600 rounded-lg py-3 font-bold transition duration-300 mb-4" :disabled="state.showLoadingOverlay">
                             {{ state.showLoadingOverlay ? '加载中...' : (isAdminUser ? '前往管理员面板' : '前往用户面板') }}
                         </button>

                         <!-- Logout Button -->
                         <button @click="handleLogout()" :disabled="state.showLoadingOverlay" class="w-full bg-red-700 hover:bg-red-600 rounded-lg py-3 font-bold transition duration-300" :class="{'opacity-50 cursor-not-allowed': state.showLoadingOverlay}">
                             {{ state.showLoadingOverlay ? '退出中...' : '退出登录' }}
                         </button>
                    </div>

                    <!-- Live Stream Button (Always visible) -->
                    <button @click="goToLive()" class="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-bold transition duration-300 text-gray-200 mt-4" :disabled="state.showLoadingOverlay">
                         {{ state.showLoadingOverlay ? '加载中...' : '观看比赛直播' }}
                    </button>
                </div>
            </div>

             </div> <!-- End of relative z-10 block -->

            <!-- Footer Info -->
            <div class="text-center text-xs text-gray-500 mt-8 relative z-10">
                 <p>{{ new Date().getFullYear() }} © NGU Team © MPAM Laboratory | <router-link to="/privacy" class="text-purple-400 hover:underline font-medium">隐私政策</router-link></p>
            </div>

        <!-- Loading Overlay -->
        <div v-if="state.showLoadingOverlay" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="text-center text-white">
                <div class="loader mb-4"></div>
                <p class="text-lg font-semibold">加载中...</p>
            </div>
        </div>

    </div> <!-- End of Root container -->
</template>

<style scoped>
/* Add or update your existing styles */

/* General Styles */
body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    min-height: 100vh;
    color: white;
}

.glass {
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in-up {
    animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Button Glow Effect */
.btn-glow {
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.btn-glow::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 300%;
    height: 300%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0) 70%); /* purple-500 glow */
    transition: transform 0.5s ease-out;
    transform: translate(-50%, -50%) scale(0);
    z-index: -1;
}

.btn-glow:hover::before {
    transform: translate(-50%, -50%) scale(1);
}

/* Triangle Background Animation */
#triangles {
    pointer-events: none;
    z-index: 0;
}

.triangle {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0.1; /* Adjust opacity */
    animation: floatUp linear infinite; /* Use linear for continuous movement */
}

@keyframes floatUp {
    0% {
        transform: translateY(0) rotate(var(--start-rotate, 0deg));
        opacity: 0.1;
    }
    100% {
        transform: translateY(var(--end-y, -100vh)) rotate(var(--end-rotate, 720deg)); /* Float up and rotate */
        opacity: 0;
    }
}


/* Loading Overlay Spinner */
.loader {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>
