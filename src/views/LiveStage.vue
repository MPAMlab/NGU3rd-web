<!-- src/views/LiveStage.vue -->
<template>
    <div class="live-stage-view bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen font-sans">
        <div class="container-full mx-auto px-4 py-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <!-- Logo and Title (Left) -->
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 glass rounded-full flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="w-8 h-8">
                    </div>
                    <span class="font-bold text-2xl text-white">NGU3rd</span>
                </div>

                <!-- Live Indicator (Center) -->
                <div class="status-tag success live-indicator px-4 py-1 animate-pulse">LIVE</div>

                <!-- Empty space for balance (Right) -->
                <div class="w-36"></div>
            </div>

            <!-- Main Stage Camera View (16:9 Horizontal) -->
            <div class="glass rounded-xl p-6 mx-auto main-camera-container">
                <div class="main-camera-frame bg-[#00FF00]"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Minimal script setup to enable Vue functionality
</script>

<style scoped>
.container-full {
    max-width: 1920px;
    width: 100%;
}

.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}

.status-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
}

.status-tag.success {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.live-indicator {
    animation: pulse 2s infinite;
}

/* Horizontal 16:9 Main Camera Container - Maximized for a 1920x1080 layout */
.main-camera-container {
    width: 90%; /* Using 90% of available width */
    max-width: 1600px; /* Maximum width cap */
}

.main-camera-frame {
    width: 100%;
    aspect-ratio: 16 / 9; /* Forces 16:9 ratio */
    border-radius: 8px;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
    100% {
        opacity: 1;
    }
}
</style>
