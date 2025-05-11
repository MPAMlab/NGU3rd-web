// src/services/api.ts
import type {
    Team, Member, Song, TournamentMatch, MatchState,
    CalculateRoundPayload, ResolveDrawPayload, SelectTiebreakerSongPayload,
    CreateTournamentMatchPayload, ConfirmMatchSetupPayload,
    MemberSongPreference, SaveMemberSongPreferencePayload,
    MatchHistoryMatch, RoundSummary, ApiResponse // Import ApiResponse from store.ts
} from '@/store'; // Import types from your Pinia store file

// API_BASE_URL points to the base path where your Worker serves the API.
// Since your Worker routes https://ngu3rd.mpam-lab.xyz/* to the worker,
// and the API endpoints are under /api/*, the relative path /api is correct
// if your frontend is served from the same domain.
const API_BASE_URL = '/api';

/**
 * Generic API call function.
 * Handles fetch, JSON parsing, and basic error checking based on ApiResponse structure.
 * @param endpoint The API endpoint (e.g., '/teams').
 * @param method HTTP method (e.g., 'GET', 'POST').
 * @param data Optional data to send in the request body for POST, PUT, etc.
 * @returns Promise<ApiResponse<T>>
 */
async function callApi<T>(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            // TODO: Add Authorization header here once Kinde is integrated
            // 'Authorization': `Bearer ${yourAuthToken}`
        },
    };

    if (data !== undefined) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        // Handle responses that might not have a body (like 204 No Content)
        if (response.status === 204) {
             return { success: true, message: 'No Content' };
        }

        // Attempt to parse JSON for other statuses
        const result: ApiResponse<T> = await response.json().catch(() => {
             // If JSON parsing fails for a non-204 response, it's an error
             return {
                 success: false,
                 error: response.statusText || `Failed to parse JSON response from ${method} ${url}`,
                 message: `Status: ${response.status}`
             };
        });

        // Check for HTTP errors (status outside 2xx) OR API-specific success: false
        if (!response.ok || !result.success) {
            // Log the error details
            console.error(`API Error: ${method} ${url}`, {
                status: response.status,
                statusText: response.statusText,
                responseBody: result
            });
            // Throw an error that can be caught by the calling Pinia action
            throw new Error(result?.error || result?.message || `API request failed with status ${response.status}`);
        }

        // If response.ok and result.success is true (or 204), return the result
        return result;

    } catch (error: any) {
        console.error(`API Fetch/Network Error: ${method} ${url}`, error);
        // Re-throw a structured error or a user-friendly message
        // The Pinia store action will catch this and set its error state.
        throw new Error(error.message || `Network request failed for ${method} ${url}`);
    }
}

// --- Teams API ---
export const fetchTeams = (): Promise<ApiResponse<Team[]>> => callApi<Team[]>('/teams');
// TODO: Add createTeam, updateTeam, deleteTeam if your backend supports them

// --- Members API ---
export const fetchMembers = (teamCode?: string): Promise<ApiResponse<Member[]>> => {
    const queryParams = new URLSearchParams();
    if (teamCode) queryParams.append('team_code', teamCode);
    const queryString = queryParams.toString();
    return callApi<Member[]>(`/members${queryString ? `?${queryString}` : ''}`);
};
// TODO: Add createMember, updateMember, deleteMember if your backend supports them

// --- Songs API ---
export const fetchSongs = (params?: { category?: string; type?: string; search?: string }): Promise<ApiResponse<Song[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    const queryString = queryParams.toString();
    return callApi<Song[]>(`/songs${queryString ? `?${queryString}` : ''}`);
};

// --- Member Song Preference API ---
export const saveMemberSongPreference = (payload: SaveMemberSongPreferencePayload): Promise<ApiResponse<MemberSongPreference>> => {
    return callApi<MemberSongPreference>('/member_song_preferences', 'POST', payload);
};
export const fetchMemberSongPreferences = (memberId: number, stage: string): Promise<ApiResponse<MemberSongPreference[]>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('member_id', memberId.toString());
    queryParams.append('stage', stage);
    const queryString = queryParams.toString();
    return callApi<MemberSongPreference[]>(`/member_song_preferences${queryString ? `?${queryString}` : ''}`);
};
// TODO: Add deleteMemberSongPreference if needed

// --- Tournament/Match API ---
export const fetchTournamentMatches = (): Promise<ApiResponse<TournamentMatch[]>> => callApi<TournamentMatch[]>('/tournament_matches');

export const createTournamentMatch = (payload: CreateTournamentMatchPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>('/tournament_matches', 'POST', payload);
};

export const confirmMatchSetup = (matchId: number, payload: ConfirmMatchSetupPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>(`/tournament_matches/${matchId}/confirm_setup`, 'PUT', payload);
};

export const startLiveMatch = (matchId: number): Promise<ApiResponse<{ message: string; match_do_id: string; do_init_result?: any }>> => {
    return callApi<{ message: string; match_do_id: string; do_init_result?: any }>(`/tournament_matches/${matchId}/start_live`, 'POST');
};

// This fetches the initial state via HTTP if needed, but WebSocket is primary for updates.
export const fetchMatchState = (doId: string): Promise<ApiResponse<MatchState>> => callApi<MatchState>(`/live-match/${doId}/state`);

// --- Durable Object Actions (forwarded via Worker) ---
// These typically return the new MatchState or a RoundSummary, but the primary update mechanism for the UI
// should be the WebSocket. The response here can be used for immediate feedback or logging.

export const calculateRound = (doId: string, payload: CalculateRoundPayload): Promise<ApiResponse<{ message: string; roundSummary: RoundSummary }>> => {
    return callApi<{ message: string; roundSummary: RoundSummary }>(`/live-match/${doId}/calculate-round`, 'POST', payload);
};

export const nextRound = (doId: string): Promise<ApiResponse<{ message: string }>> => {
    return callApi<{ message: string }>(`/live-match/${doId}/next-round`, 'POST');
};

export const selectTiebreakerSong = (doId: string, payload: SelectTiebreakerSongPayload): Promise<ApiResponse<{ message: string }>> => {
    return callApi<{ message: string }>(`/live-match/${doId}/select-tiebreaker-song`, 'POST', payload);
};

export const resolveDraw = (doId: string, payload: ResolveDrawPayload): Promise<ApiResponse<{ message: string }>> => {
    return callApi<{ message: string }>(`/live-match/${doId}/resolve-draw`, 'POST', payload);
};

export const archiveMatch = (doId: string): Promise<ApiResponse<{ message: string }>> => {
    return callApi<{ message: string }>(`/live-match/${doId}/archive`, 'POST');
};

// --- Match History API ---
export const fetchMatchHistory = (): Promise<ApiResponse<MatchHistoryMatch[]>> => callApi<MatchHistoryMatch[]>('/match_history');
