// src/composables/useKindeAuth.ts
// ADDED 'computed' to the import
import { ref, readonly, Ref, ComputedRef, nextTick, computed } from 'vue';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

// MODIFIED: Import types from your store file
import type { Member, KindeUser, ApiResponse } from '@/store'; // <--- MODIFIED IMPORT PATH

// Import the new API functions
import { kindeCallback, fetchMe, logout as apiLogout } from '@/services/api';


// --- Kinde Configuration (Get from Environment Variables) ---
const kindeConfig = {
    issuerUrl: import.meta.env.VITE_KINDE_ISSUER_URL as string,
    clientId: import.meta.env.VITE_KINDE_CLIENT_ID as string,
    redirectUri: import.meta.env.VITE_KINDE_REDIRECT_URI as string,
    logoutRedirectUri: import.meta.env.VITE_LOGOUT_REDIRECT_TARGET_URL as string,
    // audience: import.meta.env.VITE_KINDE_AUDIENCE as string | undefined,
    scope: 'openid profile email offline',
};

// --- Reactive State ---
const isAuthenticated: Ref<boolean> = ref(false);
const kindeUser: Ref<KindeUser | null> = ref(null);
const userMember: Ref<Member | null> = ref(null); // userMember now includes is_admin

// --- Constants for PKCE and State ---
const PKCE_VERIFIER_STORAGE_KEY = 'kinde_pkce_code_verifier';
const STATE_STORAGE_KEY = 'kinde_oauth_state';
// HttpOnly cookies are handled by the browser, these client-side cookie names are less critical now
// but might be used for fallback or specific client-side logic if needed (e.g., checking existence)
const ACCESS_TOKEN_COOKIE_NAME = 'kinde_access_token';
const REFRESH_TOKEN_COOKIE_NAME = 'kinde_refresh_token';


// --- Helper Functions for PKCE ---
// ... (Keep generateRandomString, base64urlencodeUint8Array, generateCodeChallenge, base64urlencodeArrayBuffer as is) ...
function generateRandomString(byteLength: number): string {
    const randomBytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(randomBytes);
    return base64urlencodeUint8Array(randomBytes);
}

function base64urlencodeUint8Array(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return base64urlencodeArrayBuffer(hashBuffer);
}

function base64urlencodeArrayBuffer(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


// --- Core Authentication Logic ---

async function checkAuthStatus(): Promise<void> {
    console.log("Checking Kinde auth status via backend /members/me...");
    // fetchUserMember will update isAuthenticated and userMember based on the backend response.
    await fetchUserMember();
    // The kindeUser state might be null if fetchKindeUserInfo is removed or fails, which is acceptable.
    console.log(`Auth status check complete. isAuthenticated: ${isAuthenticated.value}, userMember: ${userMember.value !== null}, isAdmin: ${userMember.value?.is_admin === 1}`);
}

async function fetchUserMember(): Promise<void> {
    console.log("Fetching user member data from backend /members/me...");
    try {
        // Use the new fetchMe API function which uses authenticatedFetch internally
        const response = await fetchMe(); // This call includes credentials: 'include'

        if (response.success && response.data?.member) {
            userMember.value = response.data.member;
            isAuthenticated.value = true; // If we got a member, user is authenticated
            console.log("Backend /members/me returned OK with member data. User is authenticated.");

        } else if (response.success && response.data?.member === null) {
             // Backend returned success: true but member: null, meaning authenticated but not registered
             console.log("Backend /members/me returned OK but no member data. User is authenticated but not registered.");
             isAuthenticated.value = true; // User is authenticated with Kinde
             userMember.value = null; // But no member record exists
        }
        else if (!response.success && response.error === 'Authentication required.') {
            console.warn("Backend /members/me returned 401 (via error response). User is not authenticated.");
            // Clear state if backend explicitly says auth is required and failed
            isAuthenticated.value = false;
            kindeUser.value = null; // Clear Kinde user info too
            userMember.value = null;
            // HttpOnly cookies cannot be cleared here, backend /logout handles that
        }
        else {
            console.error("Failed to fetch user member data:", response.error || 'Unknown error');
            // Treat other errors as unauthenticated for safety
            isAuthenticated.value = false;
            kindeUser.value = null;
            userMember.value = null;
        }
    } catch (e) {
        console.error("Error fetching user member data:", e);
        // Treat network errors as unauthenticated for safety
        isAuthenticated.value = false;
        kindeUser.value = null;
        userMember.value = null;
    }
}


const OAUTH_STATE_CONTEXT_STORAGE_KEY_PREFIX = 'kinde_oauth_context_';

async function login(prompt: 'login' | 'create' = 'login', context?: { teamCode: string | null, currentStep: number }): Promise<void> {
    if (!kindeConfig.issuerUrl || !kindeConfig.clientId || !kindeConfig.redirectUri) {
        console.error("Kinde configuration missing. Cannot initiate login.");
        alert("认证服务配置错误，请联系管理员。");
        return;
    }
    if (!kindeConfig.logoutRedirectUri) {
         console.error("Kinde logout redirect URI is not configured (VITE_LOGOUT_REDIRECT_TARGET_URL). Cannot initiate login.");
         alert("认证服务配置错误：退出登录目标地址未设置。");
         return;
    }

    try {
        const codeVerifier = generateRandomString(96);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateRandomString(32);

        localStorage.setItem(PKCE_VERIFIER_STORAGE_KEY, codeVerifier);
        localStorage.setItem(STATE_STORAGE_KEY, state);

        if (context) {
             localStorage.setItem(`${OAUTH_STATE_CONTEXT_STORAGE_KEY_PREFIX}${state}`, JSON.stringify(context));
             console.log("Stored OAuth state context in localStorage:", context);
        }

        console.log("Stored PKCE verifier and state in localStorage.");

        const authUrl = new URL(`${kindeConfig.issuerUrl}/oauth2/auth`);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', kindeConfig.clientId);
        authUrl.searchParams.append('redirect_uri', kindeConfig.redirectUri);
        authUrl.searchParams.append('scope', kindeConfig.scope);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('prompt', prompt);

        console.log("Redirecting to Kinde auth URL:", authUrl.toString());

        window.location.href = authUrl.toString();

    } catch (e) {
        console.error("Error initiating Kinde login flow:", e);
        alert("无法启动认证流程，请稍后再试。");
    }
}

async function handleCallback(code: string, state: string): Promise<{ success: true, user?: KindeUser, context?: { teamCode: string | null, currentStep: number } } | { success: false, error: string }> {
    console.log("Handling Kinde callback...");
    const storedState = localStorage.getItem(STATE_STORAGE_KEY);
    const storedVerifier = localStorage.getItem(PKCE_VERIFIER_STORAGE_KEY);

    let context: { teamCode: string | null, currentStep: number } | undefined;
    const contextKey = `${OAUTH_STATE_CONTEXT_STORAGE_KEY_PREFIX}${state}`;
    const storedContext = localStorage.getItem(contextKey);
    if (storedContext) {
        try {
            context = JSON.parse(storedContext);
            console.log("Retrieved OAuth state context:", context);
        } catch (e) {
            console.error("Failed to parse stored OAuth state context:", e);
        }
        localStorage.removeItem(contextKey);
    }


    if (!state || !storedState || state !== storedState) {
        console.error("State mismatch or missing state. Possible CSRF attack.");
        localStorage.removeItem(STATE_STORAGE_KEY);
        localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);
        isAuthenticated.value = false; kindeUser.value = null; userMember.value = null;
        return { success: false, error: "Authentication failed: Invalid state parameter." };
    }
    localStorage.removeItem(STATE_STORAGE_KEY);

    if (!code || !storedVerifier) {
        console.error("Missing authorization code or PKCE verifier.");
         localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);
         isAuthenticated.value = false; kindeUser.value = null; userMember.value = null;
        return { success: false, error: "Authentication failed: Missing code or verifier." };
    }
    localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);


    console.log("Exchanging code for tokens via backend /kinde/callback...");
    try {
        // Use the new kindeCallback API function
        const response = await kindeCallback({
            code: code,
            code_verifier: storedVerifier,
            redirect_uri: kindeConfig.redirectUri,
        });

        if (!response.success) {
            console.error('Backend token exchange failed:', response.error);
            isAuthenticated.value = false; kindeUser.value = null; userMember.value = null;
            return { success: false, error: response.error || 'Failed to exchange code for tokens' };
        }

        console.log("Token exchange successful via backend. Triggering auth status check...");
        // checkAuthStatus will call fetchUserMember which updates isAuthenticated and userMember
        await checkAuthStatus();

        // The backend /kinde/callback returns basic user info under data.user
        if (response.data?.user) {
             kindeUser.value = response.data.user as KindeUser;
             console.log("Kinde user info from callback:", kindeUser.value);
        } else {
             kindeUser.value = null;
        }

        return { success: true, user: kindeUser.value || undefined, context: context };

    } catch (e: any) {
        console.error("Error during token exchange callback:", e);
        isAuthenticated.value = false; kindeUser.value = null; userMember.value = null;
        return { success: false, error: e.message || 'Authentication processing failed.' };
    }
}

/**
 * Wrapper around fetch that automatically includes credentials (cookies)
 * and handles 401 responses by clearing auth state.
 * Use this for all API calls that require authentication.
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // IMPORTANT: Include cookies in CORS requests
    });

    if (response.status === 401) {
        console.warn(`Received 401 Unauthorized for ${url}. Clearing auth state.`);
        // Clear frontend state. Backend /logout handles HttpOnly cookies.
        isAuthenticated.value = false;
        kindeUser.value = null;
        userMember.value = null;
        // Client-side cookies (if any) can be cleared here
        Cookies.remove(ACCESS_TOKEN_COOKIE_NAME);
        Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
        // Optional: Redirect to the login page here if needed
        // router.push('/'); // Or handle in the component that received the 401
    } else if (response.status === 403) {
         console.warn(`Received 403 Forbidden for ${url}. User is authenticated but not authorized.`);
         // User is logged in but doesn't have permission (e.g., not admin for an admin route)
         // You might want to handle this specifically in the UI, e.g., show a permission denied message.
         // The fetch call itself doesn't need to clear auth state for 403.
    }


    return response;
}

function updateUserMember(member: Member | null): void {
    userMember.value = member;
}

async function logout(): Promise<void> {
    console.log("Initiating logout...");

    // Clear frontend state immediately for responsiveness
    isAuthenticated.value = false;
    kindeUser.value = null;
    userMember.value = null;
    // Clear non-HttpOnly cookies (best effort)
    Cookies.remove(ACCESS_TOKEN_COOKIE_NAME);
    Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
    // Clear PKCE/state from localStorage if they somehow linger
    localStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);
    localStorage.removeItem(STATE_STORAGE_KEY);
    // Clear any stored context keys starting with the prefix
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(OAUTH_STATE_CONTEXT_STORAGE_KEY_PREFIX)) {
            localStorage.removeItem(key);
        }
    });

    console.log("Frontend state cleared. Redirecting to backend logout endpoint.");

    // Use the new apiLogout function which triggers the backend redirect
    await apiLogout();

    // The apiLogout function performs a window.location.href redirect,
    // so code execution stops here in practice.
}

// Computed property for isAdmin status
const isAdminUser: ComputedRef<boolean> = computed(() => {
    return userMember.value?.is_admin === 1;
});


interface UseKindeAuthReturn {
    isAuthenticated: Readonly<Ref<boolean>>;
    kindeUser: Readonly<Ref<KindeUser | null>>;
    userMember: Readonly<Ref<Member | null>>;
    isAdminUser: Readonly<Ref<boolean>>;
    checkAuthStatus: () => Promise<void>;
    login: (prompt?: 'login' | 'create', context?: { teamCode: string | null, currentStep: number }) => Promise<void>;
    logout: () => Promise<void>;
    handleCallback: (code: string, state: string) => Promise<{ success: true, user?: KindeUser, context?: { teamCode: string | null, currentStep: number } } | { success: false, error: string }>;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    updateUserMember: (member: Member | null) => void;
}

export function useKindeAuth(): UseKindeAuthReturn {
    // Initial check is now handled by the router guard or component onMounted
    // checkAuthStatus(); // Removed initial call here

    return {
        isAuthenticated: readonly(isAuthenticated),
        kindeUser: readonly(kindeUser),
        userMember: readonly(userMember),
        isAdminUser: readonly(isAdminUser),
        checkAuthStatus,
        login,
        logout,
        handleCallback,
        authenticatedFetch,
        updateUserMember,
    };
}
