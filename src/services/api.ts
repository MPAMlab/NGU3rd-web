// src/services/api.ts
import type {
    // Import existing frontend types from store.ts
    ApiResponse, Team, Member, Song, TournamentMatch, MatchState,
    CalculateRoundPayload, ResolveDrawPayload, SelectTiebreakerSongPayload,
    CreateTournamentMatchPayload, ConfirmMatchSetupPayload,
    MemberSongPreference, SaveMemberSongPreferencePayload,
    MatchHistoryMatch, RoundSummary,
    SongsApiResponseData, SongFiltersApiResponseData,
    KindeUser, // Assuming KindeUser is also defined in store.ts

    // Import NEW frontend types from store.ts
    MatchPlayerSelectionFrontend, SaveMatchPlayerSelectionPayloadFrontend,
    FetchUserMatchSelectionDataFrontend, MatchSelectionStatusFrontend,
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
 * @param data Optional data to send in the request body for POST, PUT, etc.
 * @param options Optional fetch options to merge.
 * @returns Promise<ApiResponse<T>>
 */
async function callApi<T>(endpoint: string, method: string = 'GET', data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Create a new Headers object for mutable headers
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
        const response = await fetch(url, defaultOptions);

        if (response.status === 204) {
             return { success: true, message: 'Operation successful (No Content)' };
        }

        // Handle 401 Unauthorized specifically if needed, although useKindeAuth.authenticatedFetch does this
        // If you are NOT using authenticatedFetch wrapper in composable, you'd handle 401 here.
        // Since we are using it, the composable handles the 401 state update.

        const result = await response.json().catch((parseError) => {
             console.error(`API Error: Failed to parse JSON response from ${method} ${url}`, response.status, parseError);
             return {
                 success: false,
                 error: response.statusText || `Failed to parse JSON response (Status: ${response.status})`,
                 message: `Status: ${response.status}`
             };
        });

        if (!response.ok || (result && result.success === false)) {
            console.error(`API Error: ${method} ${url}`, {
                status: response.status,
                statusText: response.statusText,
                responseBody: result
            });
            // Throw an error to be caught by the calling Pinia action
            throw new Error(result?.error || result?.message || `API request failed with status ${response.status}`);
        }

        // Assume success if HTTP status is OK and no explicit success: false
        if (result && typeof result.success !== 'boolean') {
            result.success = true;
        }
        return result as ApiResponse<T>;

    } catch (error: any) {
        console.error(`API Fetch/Network Error: ${method} ${url}`, error);
        if (error instanceof Error) {
            throw error;
        } else {
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
    // Let's use a simple fetch for logout redirect as it's a top-level navigation.
    const url = `${API_BASE_URL}/logout`;
    // The browser will follow the redirect automatically
    // We don't expect a JSON response, so we don't use callApi
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

// joinTeam requires user authentication (backend middleware handles this)
export const joinTeam = (payload: FormData): Promise<ApiResponse<{ member: Member }>> => {
    // callApi handles FormData correctly
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

// patchMember requires user authentication (backend middleware handles this, verifies kinde_user_id)
export const patchMember = (maimaiId: string, payload: FormData): Promise<ApiResponse<{ member: Member }>> => {
    return callApi<{ member: Member }>(`/members/${maimaiId}`, 'PATCH', payload);
};

// deleteMember requires user authentication (backend middleware handles this, verifies kinde_user_id)
export const deleteMember = (maimaiId: string): Promise<ApiResponse<any>> => {
    return callApi<any>(`/members/${maimaiId}`, 'DELETE'); // Expects 204 No Content
};


// --- Songs API ---
// fetchSongs is public
export const fetchSongs = (params?: { category?: string; type?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<SongsApiResponseData>> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return callApi<SongsApiResponseData>(`/songs${queryString ? `?${queryString}` : ''}`);
};

// fetchSongFilterOptions is public
export const fetchSongFilterOptions = (): Promise<ApiResponse<SongFiltersApiResponseData>> => {
    return callApi<SongFiltersApiResponseData>('/songs/filters');
};


// --- Member Song Preference API ---
// saveMemberSongPreference requires user authentication (backend middleware handles this)
export const saveMemberSongPreference = (payload: SaveMemberSongPreferencePayload): Promise<ApiResponse<MemberSongPreference>> => {
    return callApi<MemberSongPreference>('/member_song_preferences', 'POST', payload);
};
// fetchMemberSongPreferences requires user authentication (backend middleware handles this)
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

// createTournamentMatch requires Admin authentication (backend middleware handles this)
export const createTournamentMatch = (payload: CreateTournamentMatchPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>('/tournament_matches', 'POST', payload);
};

// confirmMatchSetup requires Admin authentication (backend middleware handles this)
export const confirmMatchSetup = (matchId: number, payload: ConfirmMatchSetupPayload): Promise<ApiResponse<TournamentMatch>> => {
    return callApi<TournamentMatch>(`/tournament_matches/${matchId}/confirm_setup`, 'PUT', payload);
};

// startLiveMatch requires Admin authentication (backend middleware handles this)
export const startLiveMatch = (matchId: number): Promise<ApiResponse<{ message: string; match_do_id: string; do_init_result?: any }>> => {
    return callApi<{ message: string; match_do_id: string; do_init_result?: any }>(`/tournament_matches/${matchId}/start_live`, 'POST');
};

// fetchMatchState is public
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

// --- Admin API ---
// fetchAdminMembers requires Admin authentication (backend middleware handles this)
export const fetchAdminMembers = (): Promise<ApiResponse<{ members: Member[] }>> => {
    return callApi<{ members: Member[] }>('/admin/members', 'GET');
};

// TODO: Add other admin API calls (add/patch/delete members, update settings, etc.)
// These will also require Admin authentication via backend middleware.
// Fetch data for the user's match selection page


// --- Member Match Selection API ---

export const fetchUserMatchSelectionData = (matchId: number): Promise<ApiResponse<FetchUserMatchSelectionData>> => {
    // Requires user authentication (backend middleware handles this)
    return callApi<FetchUserMatchSelectionData>(`/member/match-selection/${matchId}`, 'GET');
};

// Save user's song selections and order for a match
export const saveMatchPlayerSelection = (matchId: number, payload: SaveMatchPlayerSelectionPayload): Promise<ApiResponse<MatchPlayerSelection>> => {
    // Requires user authentication (backend middleware handles this)
    return callApi<MatchPlayerSelection>(`/member/match-selection/${matchId}`, 'POST', payload);
};

// --- NEW Staff Match Setup Compilation API ---

// Check selection status for a match (for Staff)
export const checkMatchSelectionStatus = (matchId: number): Promise<ApiResponse<MatchSelectionStatus>> => {
    // Requires Admin authentication (backend middleware handles this)
    return callApi<MatchSelectionStatus>(`/tournament_matches/${matchId}/selection-status`, 'GET');
};

// Compile final match setup from player selections (for Staff)
export const compileMatchSetup = (matchId: number): Promise<ApiResponse<CompileMatchSetupResponse>> => {
    // Requires Admin authentication (backend middleware handles this)
    return callApi<CompileMatchSetupResponse>(`/tournament_matches/${matchId}/compile-setup`, 'POST');
};
// --- NEW Member Match Selection API ---

// Fetch data for the user's match selection page
export const fetchUserMatchSelectionData = (matchId: number): Promise<ApiResponse<FetchUserMatchSelectionDataFrontend>> => {
    // Requires user authentication (backend middleware handles this)
    return callApi<FetchUserMatchSelectionDataFrontend>(`/member/match-selection/${matchId}`, 'GET');
};

// Save user's song selections and order for a match
// Backend returns { selection: MatchPlayerSelection }
export const saveMatchPlayerSelection = (matchId: number, payload: SaveMatchPlayerSelectionPayloadFrontend): Promise<ApiResponse<{ selection: MatchPlayerSelectionFrontend }>> => {
    // Requires user authentication (backend middleware handles this)
    return callApi<ApiResponse<{ selection: MatchPlayerSelectionFrontend }>>(`/member/match-selection/${matchId}`, 'POST', payload);
};

// --- NEW Staff Match Setup Compilation API ---

// Check selection status for a match (for Staff)
export const checkMatchSelectionStatus = (matchId: number): Promise<ApiResponse<MatchSelectionStatusFrontend>> => {
    // Requires Admin authentication (backend middleware handles this)
    return callApi<MatchSelectionStatusFrontend>(`/tournament_matches/${matchId}/selection-status`, 'GET');
};

// Compile final match setup from player selections (for Staff)
export const compileMatchSetup = (matchId: number): Promise<ApiResponse<CompileMatchSetupResponseFrontend>> => {
    // Requires Admin authentication (backend middleware handles this)
    return callApi<CompileMatchSetupResponseFrontend>(`/tournament_matches/${matchId}/compile-setup`, 'POST');
};