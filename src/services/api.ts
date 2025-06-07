// src/services/api.ts
import type {
    // Import ALL necessary types from your Pinia store file
    ApiResponse,
    KindeUser,
    Team,
    Member,
    Song,
    SongLevel, // Needed for parsing levels if done in API layer (though store does it)
    MemberSongPreference,
    SaveMemberSongPreferencePayload,
    MatchSong,
    TournamentMatch,
    CreateTournamentMatchPayload,
    ConfirmMatchSetupPayload,
    MatchState,
    CalculateRoundPayload,
    ResolveDrawPayload,
    SelectTiebreakerSongPayload,
    RoundSummary,
    MatchHistoryMatch,
    MatchHistoryRound,
    PaginationInfo,
    SongsApiResponseData,
    SongFiltersApiResponseData, // This type needs to be updated in store.ts
    InternalProfession, // Although this is backend-internal, it's in your store types

    // Import NEW frontend types defined in store.ts
    MatchPlayerSelectionFrontend,
    SaveMatchPlayerSelectionPayloadFrontend,
    FetchUserMatchSelectionDataFrontend, // This type needs to be updated in store.ts
    MatchSelectionStatusFrontend,
    CompileMatchSetupResponseFrontend
} from '@/store'; // Import types from your Pinia store file

// API_BASE_URL remains the same
const API_BASE_URL = '/api';

/**
 * Generic API call function.
 * Handles fetch, JSON parsing, and basic error checking based on ApiResponse structure.
 * Includes credentials to send HttpOnly cookies.
 * @param endpoint The API endpoint (e.g., '/teams').
 * @param method HTTP method (e.g., 'GET', 'POST').
 * @param data Optional data to send in the request body for POST, PUT, etc. Can be JSON object or FormData.
 * @param options Optional fetch options to merge.
 * @returns Promise<ApiResponse<T>>
 */
async function callApi<T>(endpoint: string, method: string = 'GET', data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Create a new Headers object for mutable headers, merging provided headers
    const headers = new Headers(options.headers);

    // Set default Content-Type unless it's FormData or already set
    if (!(data instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const defaultOptions: RequestInit = {
        method,
        headers: headers, // Use the mutable Headers object
        credentials: 'include', // <-- IMPORTANT: Include cookies in requests
        ...options, // Merge provided options, allowing override
    };

    // Set body for non-FormData data
    if (!(data instanceof FormData) && data !== undefined) {
        defaultOptions.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
        defaultOptions.body = data; // Use FormData directly
        // Browser will set Content-Type: multipart/form-data with boundary automatically
        // Do NOT manually set Content-Type for FormData
        headers.delete('Content-Type'); // Ensure Content-Type is removed if it was set
    }


    try {
        console.log(`API Call: ${method} ${url}`, { options: defaultOptions, data });
        const response = await fetch(url, defaultOptions);
        console.log(`API Response: ${method} ${url} Status: ${response.status}`);


        if (response.status === 204) {
             // No content response, assume success
             return { success: true, message: 'Operation successful (No Content)' } as ApiResponse<T>; // Cast as T might be void
        }

        // Attempt to parse JSON response
        const result = await response.json().catch((parseError) => {
             console.error(`API Error: Failed to parse JSON response from ${method} ${url}`, response.status, parseError);
             // If JSON parsing fails, return a generic error structure
             return {
                 success: false,
                 error: response.statusText || `Failed to parse JSON response (Status: ${response.status})`,
                 message: `Status: ${response.status}`
             };
        });

        // Check for HTTP errors (status outside 2xx) or explicit success: false from backend
        if (!response.ok || (result && typeof result === 'object' && result.success === false)) {
            console.error(`API Error: ${method} ${url}`, {
                status: response.status,
                statusText: response.statusText,
                responseBody: result
            });
            // Throw an error to be caught by the calling Pinia action
            // Use the error/message from the backend response if available, otherwise use status text
            throw new Error(result?.error || result?.message || `API request failed with status ${response.status}`);
        }

        // If response.ok is true and no explicit success: false, assume success
        // Ensure the result object has success: true if it wasn't explicitly set by backend
        if (result && typeof result === 'object' && typeof result.success !== 'boolean') {
            result.success = true;
        }

        return result as ApiResponse<T>;

    } catch (error: any) {
        console.error(`API Fetch/Network Error: ${method} ${url}`, error);
        // Re-throw the error so the calling code (Pinia action) can handle it
        if (error instanceof Error) {
            throw error;
        } else {
            // Wrap non-Error exceptions in an Error object
            throw new Error(String(error) || `Network request failed for ${method} ${url}`);
        }
    }
}

// --- Kinde Auth API ---
// This endpoint is called by the KindeCallback view/composable
export const kindeCallback = (payload: { code: string; code_verifier: string; redirect_uri: string }): Promise<ApiResponse<{ user: KindeUser | {} }>> => {
    // Note: This specific call might not need credentials: 'include' if it's the first call,
    // but including it is harmless. The backend sets the cookies in the response.
    return callApi<{ user: KindeUser | {} }>('/kinde/callback', 'POST', payload);
};

// This endpoint is called by the logout action
export const logout = (): Promise<ApiResponse<any>> => {
    // This will trigger the backend to clear cookies and redirect.
    // The frontend doesn't process the response body here, just initiates the redirect.
    // The callApi wrapper might throw if the redirect isn't handled as a successful response.
    // A simple fetch might be better here, or handle the redirect status in callApi.
    // Let's use a simple fetch for logout redirect.
    const url = `${API_BASE_URL}/logout`;
    console.log(`API: Initiating logout redirect to ${url}`);
    // The browser will follow the redirect automatically
    // We don't expect a standard JSON response, so we don't use callApi
    return fetch(url, { method: 'GET', credentials: 'include' }) as Promise<any>; // Cast to any as we don't expect a standard ApiResponse
};

// This endpoint is called by checkAuthStatus to get user/member info
export const fetchMe = (): Promise<ApiResponse<{ member: Member | null; message?: string }>> => {
    // This requires the HttpOnly cookie to be sent
    return callApi<{ member: Member | null; message?: string }>('/members/me', 'GET');
};


// --- Teams API ---
// fetchTeams is public, but callApi includes credentials anyway (harmless)
export const fetchTeams = (): Promise<ApiResponse<Team[]>> => callApi<Team[]>('/teams');

// checkTeam is public
export const checkTeam = (teamCode: string): Promise<ApiResponse<{ code: string; name: string; members: Partial<Member>[] }>> => {
    return callApi<{ code: string; name: string; members: Partial<Member>[] }>('/teams/check', 'POST', { teamCode });
};

// createTeam is public
export const createTeam = (teamCode: string, teamName: string): Promise<ApiResponse<{ code: string; name: string; }>> => {
    return callApi<{ code: string; name: string; }>('/teams/create', 'POST', { teamCode, teamName });
};

// joinTeam requires user authentication (handled by backend middleware)
export const joinTeam = (payload: FormData): Promise<ApiResponse<{ member: Member }>> => {
    // callApi handles FormData correctly if Content-Type is not set
    return callApi<{ member: Member }>('/teams/join', 'POST', payload);
};


// --- Members API ---
// fetchMembers is public (can filter by team_code)
export const fetchMembers = (teamCode?: string): Promise<ApiResponse<Member[]>> => {
    const queryParams = new URLSearchParams();
    if (teamCode) queryParams.append('team_code', teamCode);
    const queryString = queryParams.toString();
    return callApi<Member[]>(`/members${queryString ? `?${queryString}` : ''}`);
};

// fetchMemberById is public
export const fetchMemberById = (memberId: number): Promise<ApiResponse<Member>> => {
    return callApi<Member>(`/members/${memberId}`, 'GET');
};

// patchMember requires user authentication (uses maimaiId in URL, backend verifies kinde_user_id)
export const patchMember = (maimaiId: string, payload: FormData): Promise<ApiResponse<{ member: Member }>> => {
    return callApi<{ member: Member }>(`/members/${maimaiId}`, 'PATCH', payload);
};

// deleteMember requires user authentication (uses maimaiId in URL, backend verifies kinde_user_id)
export const deleteMember = (maimaiId: string): Promise<ApiResponse<any>> => {
    // Expects 204 No Content on success
    return callApi<any>(`/members/${maimaiId}`, 'DELETE');
};


// --- Songs API ---
// fetchSongs is public (paginated)
// Corrected: Added level and difficulty to the params type
export const fetchSongs = (params?: { category?: string; type?: string; search?: string; level?: string; difficulty?: string; page?: number; limit?: number }): Promise<ApiResponse<SongsApiResponseData>> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    // Corrected: Append level and difficulty if they exist
    if (params?.level) queryParams.append('level', params.level);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.page !== undefined && params.page !== null) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined && params.limit !== null) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return callApi<SongsApiResponseData>(`/songs${queryString ? `?${queryString}` : ''}`);
};

// fetchAllSongs is public (used for picker, assumes backend /songs endpoint returns all if no pagination params)
// NOTE: If your backend /songs endpoint *always* returns paginated data, you might need a different endpoint
// like /songs/all or modify this function to fetch all pages.
// Based on the backend code, /api/songs without limit/page params seems to return all songs.
export const fetchAllSongs = (): Promise<ApiResponse<Song[]>> => {
     // Call /songs endpoint without pagination parameters
     // The backend returns { songs: Song[], pagination: PaginationInfo } for paginated calls.
     // If called without pagination, it might return just Song[] or { songs: Song[] }.
     // Let's assume it returns { songs: Song[] } for consistency, even if pagination is null/default.
     // Adjust the return type based on your actual backend implementation for the "all" case.
     // If it returns Song[] directly:
     // return callApi<Song[]>('/songs');
     // If it returns { songs: Song[] } with pagination:
     return callApi<SongsApiResponseData>('/songs').then(response => {
         if (response.success && response.data) {
             // Extract the songs array from the paginated response structure
             // Note: If backend returns ALL songs without pagination, response.data might just be Song[]
             // Need to confirm backend behavior. Assuming it's { songs: Song[] } even for all.
             return { success: true, data: response.data.songs, message: response.message };
         }
         // Propagate error or return empty array on failure
         return { success: false, error: response.error || 'Failed to fetch all songs', data: [] };
     });
};


// fetchSongFilterOptions is public
// This function calls /api/songs/filters. The backend handler needs to return levels and difficulties.
export const fetchSongFilterOptions = (): Promise<ApiResponse<SongFiltersApiResponseData>> => {
    // Corrected: The return type is now SongFiltersApiResponseData which includes levels and difficulties
    return callApi<SongFiltersApiResponseData>('/songs/filters');
};


// --- Member Song Preference API ---
// saveMemberSongPreference requires user authentication (handled by backend middleware)
export const saveMemberSongPreference = (payload: SaveMemberSongPreferencePayload): Promise<ApiResponse<MemberSongPreference>> => {
    return callApi<MemberSongPreference>('/member_song_preferences', 'POST', payload);
};
// fetchMemberSongPreferences requires user authentication (handled by backend middleware)
export const fetchMemberSongPreferences = (memberId: number, stage: string): Promise<ApiResponse<MemberSongPreference[]>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('member_id', memberId.toString());
    queryParams.append('stage', stage);
    const queryString = queryParams.toString();
    return callApi<MemberSongPreference[]>(`/member_song_preferences?${queryString}`);
};


// --- Tournament/Match API ---
// fetchTournamentMatches is public
export const fetchTournamentMatches = (): Promise<ApiResponse<TournamentMatch[]>> => callApi<TournamentMatch[]>('/tournament_matches');

// createTournamentMatch requires Admin authentication (handled by backend middleware)
export const createTournamentMatch = (payload: CreateTournamentMatchPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>('/tournament_matches', 'POST', payload);
};

// confirmMatchSetup requires Admin authentication (handled by backend middleware)
export const confirmMatchSetup = (matchId: number, payload: ConfirmMatchSetupPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>(`/tournament_matches/${matchId}/confirm_setup`, 'PUT', payload);
};

// startLiveMatch requires Admin authentication (handled by backend middleware)
export const startLiveMatch = (matchId: number): Promise<ApiResponse<{ message: string; match_do_id: string; do_init_result?: any }>> => {
    return callApi<{ message: string; match_do_id: string; do_init_result?: any }>(`/tournament_matches/${matchId}/start_live`, 'POST');
};

// fetchMatchState is public (DO state is public for spectators)
export const fetchMatchState = (doId: string): Promise<ApiResponse<MatchState>> => callApi<MatchState>(`/live-match/${doId}/state`);

// --- Durable Object Actions (forwarded via Worker, require Admin Auth) ---
// These calls will be protected by the adminAuthMiddleware on the backend
export const calculateRound = (doId: string, payload: CalculateRoundPayload): Promise<ApiResponse<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>> => {
    return callApi<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>(`/live-match/${doId}/calculate-round`, 'POST', payload);
};

export const nextRound = (doId: string): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; matchState?: MatchState }>(`/live-match/${doId}/next-round`, 'POST');
};

export const selectTiebreakerSong = (doId: string, payload: SelectTiebreakerSongPayload): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>(`/live-match/${doId}/select-tiebreaker-song`, 'POST', payload);
};

export const resolveDraw = (doId: string, payload: ResolveDrawPayload): Promise<ApiResponse<{ message?: string; matchState?: MatchState }>> => {
    return callApi<{ message?: string; roundSummary?: RoundSummary; matchState?: MatchState }>(`/live-match/${doId}/resolve-draw`, 'POST', payload);
};

export const archiveMatch = (doId: string): Promise<ApiResponse<{ message?: string }>> => {
    return callApi<{ message?: string }>(`/live-match/${doId}/archive`, 'POST');
};

// --- Match History API ---
// fetchMatchHistory is public
export const fetchMatchHistory = (): Promise<ApiResponse<MatchHistoryMatch[]>> => callApi<MatchHistoryMatch[]>('/match_history');
// --- NEW API CALL FOR USER'S MATCHES ---
// fetchUserMatches requires user authentication (handled by backend middleware)
// Corresponds to GET /api/member/matches
export const fetchUserMatches = (): Promise<ApiResponse<TournamentMatch[]>> => {
    return callApi<TournamentMatch[]>('/member/matches', 'GET');
};

// --- NEW API CALLS FOR USER MATCH SELECTION AND STAFF COMPILATION ---

// fetchUserMatchSelectionData requires user authentication (handled by backend middleware)
// Corresponds to GET /api/member/match-selection/:matchId
// Corrected: The return type is now FetchUserMatchSelectionDataFrontend which includes match details with names
export const fetchUserMatchSelectionData = (matchId: number): Promise<ApiResponse<FetchUserMatchSelectionDataFrontend>> => {
    return callApi<FetchUserMatchSelectionDataFrontend>(`/member/match-selection/${matchId}`, 'GET');
};
// saveMatchPlayerSelection requires user authentication (handled by backend middleware)
// Corresponds to POST /api/member/match-selection/:matchId
// Backend returns { selection: MatchPlayerSelection }
export const saveMatchPlayerSelection = (matchId: number, payload: SaveMatchPlayerSelectionPayloadFrontend): Promise<ApiResponse<{ selection: MatchPlayerSelectionFrontend }>> => {
    // The backend returns an object { selection: MatchPlayerSelection }.
    // We need to type this correctly.
    return callApi<{ selection: MatchPlayerSelectionFrontend }>(`/member/match-selection/${matchId}`, 'POST', payload);
};

// fetchMatchSelectionStatus requires Admin authentication (handled by backend middleware)
// Corresponds to GET /api/tournament_matches/:matchId/selection-status
export const fetchMatchSelectionStatus = (matchId: number): Promise<ApiResponse<MatchSelectionStatusFrontend>> => {
    return callApi<MatchSelectionStatusFrontend>(`/tournament_matches/${matchId}/selection-status`, 'GET');
};

// compileMatchSetup requires Admin authentication (handled by backend middleware)
// Corresponds to POST /api/tournament_matches/:matchId/compile-setup
// Backend returns { success: boolean, message: string, tournamentMatch?: TournamentMatch }
export const compileMatchSetup = (matchId: number): Promise<ApiResponse<CompileMatchSetupResponseFrontend>> => {
    return callApi<CompileMatchSetupResponseFrontend>(`/tournament_matches/${matchId}/compile-setup`, 'POST');
};


// --- Admin API ---
// fetchAdminMembers requires Admin authentication (handled by backend middleware)
export const fetchAdminMembers = (): Promise<ApiResponse<{ members: Member[] }>> => {
    return callApi<{ members: Member[] }>('/admin/members', 'GET');
};

// Example Admin Patch Member (using ID instead of Maimai ID for admin)
// Corresponds to PATCH /api/admin/members/:id
export const adminPatchMember = (memberId: number, payload: FormData): Promise<ApiResponse<{ member: Member }>> => {
    return callApi<{ member: Member }>(`/admin/members/${memberId}`, 'PATCH', payload);
};
// Example Admin Delete Member
// Corresponds to DELETE /api/admin/members/:id
export const adminDeleteMember = (memberId: number): Promise<ApiResponse<any>> => {
    return callApi<any>(`/admin/members/${memberId}`, 'DELETE'); // Expects 204 No Content
};
// Example Admin Update Settings
// Corresponds to PUT /api/admin/settings
// Note: Backend index.ts doesn't have this handler yet, but adding the API call here.
export const adminUpdateSettings = (payload: { collection_paused: boolean }): Promise<ApiResponse<any>> => {
    return callApi<any>('/admin/settings', 'PUT', payload); // Expects 200 or 204
};

