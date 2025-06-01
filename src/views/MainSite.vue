<!-- src/views/MainSite.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
// Import useRoute from vue-router
import { useRoute, useRouter } from 'vue-router'; // <--- ADDED useRouter here too, just in case you need it later, but useRoute is the fix
// Import the store to access auth state and actions
import { useAppStore } from '@/store'; // Adjust path if necessary

const store = useAppStore();
const route = useRoute(); // <--- Now useRoute is defined

// Define event information
const eventInfo = {
    title: "NGU 3rd 音游娱乐赛",
    location: "翡尔堡家庭娱乐中心(郑州万象城三楼店)",
    time: "2025年6月8日",
    description: "Never ever and ever... 具体规则以及如有变动，请留意群内公告。",
};

// Optional: Handle team code from URL query parameter after callback
onMounted(() => {
    // const route = useRoute(); // REMOVE this line, it's defined above now
    const teamCode = route.query.code as string | undefined;
    if (teamCode) {
        console.log("MainSite: Received team code from URL:", teamCode);
        // You might want to store this teamCode in the store or local state
        // for the user to easily join this team after registration.
        // Example: store.setJoiningTeamCode(teamCode);
        // Or, if the registration flow starts here, pass it to the login/registration component.
    }
});

// Function to initiate Kinde login
const handleLogin = () => {
    // Call the login action from the store
    // You can pass context here if needed, e.g., the teamCode from the URL
    // store.login('login', { teamCode: route.query.code as string | null, currentStep: 1 }); // Example with context
    store.login('login'); // Simple login without context for now
};

// Function to initiate Kinde signup (create account)
const handleSignup = () => {
    // Call the login action with prompt 'create'
    // store.login('create', { teamCode: route.query.code as string | null, currentStep: 1 }); // Example with context
    store.login('create'); // Simple signup without context for now
};

// You might want to redirect authenticated users who are already registered
// to a different page (e.g., their profile or a dashboard).
// This logic could live here or in a router guard.
// For now, let's keep it simple and just show the info page.
// The registration flow itself would likely be a multi-step component on this page or a sub-route.

</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white py-12 px-4">
        <div class="w-full max-w-2xl mx-auto text-center glass rounded-lg p-8 shadow-xl">
            <h1 class="text-4xl md:text-5xl font-bold text-purple-500 mb-6">{{ eventInfo.title }}</h1>

            <div class="mb-6 text-lg md:text-xl">
                <p class="mb-2"><strong>地点:</strong> {{ eventInfo.location }}</p>
                <p><strong>时间:</strong> {{ eventInfo.time }}</p>
            </div>

            <div class="text-left text-gray-300 mb-8 leading-relaxed">
                <p class="text-base md:text-lg">{{ eventInfo.description }}</p>
                <!-- Add more detailed rules/info here -->
            </div>

            <!-- Login/Signup buttons shown only if not authenticated -->
            <div v-if="!store.isAuthenticated" class="mt-8 space-y-4">
                <p class="text-lg font-semibold">立即加入比赛！</p>
                <button
                    @click="handleSignup"
                    class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                    注册并加入队伍
                </button>
                 <button
                    @click="handleLogin"
                    class="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 ml-0 md:ml-4"
                >
                    已有账号，直接登录
                </button>
            </div>

            <!-- Message if authenticated but not registered -->
             <div v-else-if="store.isAuthenticated && !store.userMember" class="mt-8 text-lg text-yellow-400">
                 <p>你已登录，但尚未注册选手信息。请前往注册页面完成报名。</p>
                 <!-- Link to registration component/section if applicable -->
             </div>

             <!-- Message if authenticated and registered -->
             <div v-else-if="store.isAuthenticated && store.userMember" class="mt-8 text-lg text-green-400">
                 <p>你已登录并完成选手注册。</p>
                 <!-- Link to profile or dashboard if applicable -->
             </div>

        </div>
    </div>
</template>

<style scoped>
/* Add or adjust styles as needed */
.glass {
    background: rgba(255, 255, 255, 0.1); /* Semi-transparent white */
    backdrop-filter: blur(10px); /* Apply blur effect */
    border: 1px solid rgba(255, 255, 255, 0.2); /* Light border */
}
</style>
