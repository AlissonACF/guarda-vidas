import { clearAuth, getStoredToken } from "./auth";

const DEFAULT_API_URL = "http://localhost:8080";

export const API_URL = (
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API ||
    DEFAULT_API_URL
).replace(/\/$/, "");

export const API_ROUTES = {
    login: process.env.REACT_APP_ROUTE_LOGIN || "/auth/login",
    ping: process.env.REACT_APP_ROUTE_PING || "/auth/ping",
    postos: process.env.REACT_APP_ROUTE_POSTOS || "/postos",
    checkin: process.env.REACT_APP_ROUTE_CHECKIN || "/check/in",
    checkout: process.env.REACT_APP_ROUTE_CHECKOUT || "/checkout/registrar",
    relatorioCheckins: process.env.REACT_APP_ROUTE_RELATORIO_CHECKINS || "/admin/relatorios/checkins",
    relatorioCheckouts: process.env.REACT_APP_ROUTE_RELATORIO_CHECKOUTS || "/admin/relatorios/checkouts",
    arquivos: process.env.REACT_APP_ROUTE_ARQUIVOS || "/admin/arquivos",
};

export function getToken() {
    return getStoredToken();
}

export function apiUrl(route) {
    const savedApiUrl = localStorage.getItem("serverUrl");
    const baseUrl = (savedApiUrl || API_URL).replace(/\/$/, "");
    return `${baseUrl}${route}`;
}

export async function apiFetch(route, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(apiUrl(route), {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        clearAuth();
    }

    if (!response.ok) {
        let message = `Erro ${response.status}`;

        try {
            const data = await response.json();
            message = data.message || data.error || data.errors?.[0] || message;
        } catch {
            try {
                const text = await response.text();
                message = text || message;
            } catch {
                message = response.statusText || message;
            }
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json") ? response.json() : response.text();
}

export async function apiFetchBlob(route, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(apiUrl(route), {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        clearAuth();
    }

    if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
    }

    return response.blob();
}
