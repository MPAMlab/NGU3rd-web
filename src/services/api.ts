// src/services/api.ts
import type {
    Team, Member, Song, TournamentMatch, MatchState,
    CalculateRoundPayload, ResolveDrawPayload, SelectTiebreakerSongPayload,
    CreateTournamentMatchPayload, ConfirmMatchSetupPayload,
    MemberSongPreference, SaveMemberSongPreferencePayload,
    MatchHistoryMatch, RoundSummary, ApiResponse,
    // --- Import the new types needed ---
    SongsApiResponseData,
    SongFiltersApiResponseData
} from '@/store'; // Import types from your Pinia store file

// API_BASE_URL remains the same
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
             // Return a success structure even for 204, as the operation succeeded
             return { success: true, message: 'Operation successful (No Content)' };
        }

        // Attempt to parse JSON for other statuses
        const result = await response.json().catch((parseError) => {
             // If JSON parsing fails for a non-204 response, it's an error
             console.error(`API Error: Failed to parse JSON response from ${method} ${url}`, parseError);
             return {
                 success: false,
                 error: response.statusText || `Failed to parse JSON response (Status: ${response.status})`,
                 message: `Status: ${response.status}`
             };
        });

        // Check for HTTP errors (status outside 2xx) OR API-specific success: false
        // Important: Check result.success *after* parsing JSON
        if (!response.ok || (result && result.success === false)) {
            // Log the error details
            console.error(`API Error: ${method} ${url}`, {
                status: response.status,
                statusText: response.statusText,
                responseBody: result // Log the parsed body even if success: false
            });
            // Throw an error that can be caught by the calling Pinia action
            // Prioritize error message from the API response if available
            throw new Error(result?.error || result?.message || `API request failed with status ${response.status}`);
        }

        // If response.ok and result.success is true (or wasn't explicitly false), return the result
        // Ensure result has at least { success: true } if parsing succeeded but backend didn't send it
        if (result && typeof result.success !== 'boolean') {
            result.success = true; // Assume success if HTTP status was OK and parsing worked
        }
        return result as ApiResponse<T>; // Cast needed as result might have been error object initially

    } catch (error: any) {
        console.error(`API Fetch/Network Error: ${method} ${url}`, error);
        // Re-throw a structured error or a user-friendly message
        // The Pinia store action will catch this and set its error state.
        // Ensure we throw an actual Error object
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(String(error) || `Network request failed for ${method} ${url}`);
        }
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

// UPDATED: fetchSongs to accept pagination/filters and return correct type
export const fetchSongs = (params?: { category?: string; type?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<SongsApiResponseData>> => {
    const queryParams = new URLSearchParams();
    // Append parameters only if they have a value
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    // Use the correct generic type SongsApiResponseData for callApi
    return callApi<SongsApiResponseData>(`/songs${queryString ? `?${queryString}` : ''}`);
};

// NEW: fetchSongFilterOptions function
export const fetchSongFilterOptions = (): Promise<ApiResponse<SongFiltersApiResponseData>> => {
    // Use the correct generic type SongFiltersApiResponseData for callApi
    return callApi<SongFiltersApiResponseData>('/songs/filters');
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
    return callApi<MemberSongPreference[]>(`/member_song_preferences?${queryString}`); // Added ?
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

// Adjusted return type based on typical DO responses (often just a message or updated state)
export const calculateRound = (doId: string, payload: CalculateRoundPayload): Promise<ApiResponse<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>> => {
    return callApi<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>(`/live-match/${doId}/calculate-round`, 'POST', payload);
};

export const nextRound = (doId: string): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; matchState?: MatchState }>(`/live-match/${doId}/next-round`, 'POST');
};

export const selectTiebreakerSong = (doId: string, payload: SelectTiebreakerSongPayload): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; matchState?: MatchState }>(`/live-match/${doId}/select-tiebreaker-song`, 'POST', payload);
};

export const resolveDraw = (doId: string, payload: ResolveDrawPayload): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; matchState?: MatchState }>(`/live-match/${doId}/resolve-draw`, 'POST', payload);
};

export const archiveMatch = (doId: string): Promise<ApiResponse<{ message?: string }>> => {
    return callApi<{ message?: string }>(`/live-match/${doId}/archive`, 'POST');
};

// --- Match History API ---
export const fetchMatchHistory = (): Promise<ApiResponse<MatchHistoryMatch[]>> => callApi<MatchHistoryMatch[]>('/match_history');
