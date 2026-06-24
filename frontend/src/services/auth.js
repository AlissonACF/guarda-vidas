const TOKEN_KEY = "token";
const ROLE_KEY = "tipo";

function decodeBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return atob(padded);
}

export function parseJwt(token) {
    if (!token) return null;

    try {
        const [, payload] = token.split(".");
        if (!payload) return null;
        return JSON.parse(decodeBase64Url(payload));
    } catch {
        return null;
    }
}

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRole() {
    return localStorage.getItem(ROLE_KEY);
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem("selectedPostoId");
    localStorage.removeItem("selectedPostoNome");
}

export function saveAuth(token, role) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
}

export function isTokenExpired(token) {
    const payload = parseJwt(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now();
}

export function getAuthState() {
    const token = getStoredToken();
    const payload = parseJwt(token);
    const role = payload?.role || getStoredRole();
    const authenticated = Boolean(token && payload && !isTokenExpired(token));

    if (!authenticated && token) {
        clearAuth();
    }

    return {
        authenticated,
        token: authenticated ? token : null,
        role: authenticated ? role : null,
        payload: authenticated ? payload : null,
    };
}

export function getDefaultAuthenticatedRoute(role) {
    return role === "ADMIN" ? "/dashboard" : "/postos";
}
