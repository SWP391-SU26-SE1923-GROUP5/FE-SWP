/**
 * Server-side client for the AIStudyHub backend API (BE-SWP).
 *
 * The frontend's admin module consumes the .NET backend through this
 * helper. The wrapper:
 *  - Resolves the base URL from environment variables.
 *  - Attaches a bearer token (a service account token from
 *    `BACKEND_SERVICE_TOKEN`, or the active user's JWT if provided).
 *  - Throws structured `BackendApiError` instances on non-2xx responses
 *    so callers can surface a clean error message.
 *
 * This client is server-only because it reads tokens and may use
 * admin-only credentials. Never import it from a `"use client"` file.
 */

import "server-only";

const DEFAULT_TIMEOUT_MS = 15_000;

const BACKEND_CANDIDATES = [
    process.env.BACKEND_API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    "http://localhost:5000",
    "https://localhost:5001",
].filter(Boolean) as string[];

const stripTrailingSlash = (value: string) => value.replace(/\/+$/u, "");

export class BackendApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "BackendApiError";
        this.status = status;
        this.body = body;
    }
}

const resolveBaseUrl = (): string => {
    const candidate = BACKEND_CANDIDATES.map(stripTrailingSlash).find((value) => value.length > 0);
    if (!candidate) {
        throw new BackendApiError("Backend API URL is not configured.", 500, null);
    }
    return candidate;
};

export interface BackendRequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    token?: string | null;
    signal?: AbortSignal;
    timeoutMs?: number;
    headers?: Record<string, string>;
}

const buildUrl = (baseUrl: string, path: string, query?: BackendRequestOptions["query"]): string => {
    const url = new URL(path.startsWith("/") ? path : `/${path}`, `${baseUrl}/`);
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value === undefined || value === null) continue;
            url.searchParams.set(key, String(value));
        }
    }
    return url.toString();
};

const extractErrorMessage = (body: unknown, fallback: string): string => {
    if (!body) return fallback;
    if (typeof body === "string") return body;
    if (typeof body === "object") {
        const record = body as Record<string, unknown>;
        const candidates = [record.message, record.error, record.title, record.detail];
        for (const value of candidates) {
            if (typeof value === "string" && value.trim().length) return value;
        }
        const errors = record.errors;
        if (errors && typeof errors === "object") {
            const first = Object.values(errors as Record<string, unknown[]>)[0]?.[0];
            if (typeof first === "string") return first;
        }
    }
    return fallback;
};

export const backendFetch = async <T>(path: string, options: BackendRequestOptions = {}): Promise<T> => {
    const {method = "GET", query, body, token, timeoutMs = DEFAULT_TIMEOUT_MS, headers: extraHeaders} = options;

    const baseUrl = resolveBaseUrl();
    const url = buildUrl(baseUrl, path, query);

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(extraHeaders ?? {}),
    };
    if (body !== undefined) {
        headers["Content-Type"] ??= "application/json";
    }
    const bearer = token ?? process.env.BACKEND_SERVICE_TOKEN ?? null;
    if (bearer) {
        headers.Authorization = `Bearer ${bearer}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (options.signal) {
        options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store",
            signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") ?? "";
        const isJson = contentType.toLowerCase().includes("application/json");
        const parsed: unknown = isJson ? await response.json().catch(() => null) : await response.text();

        if (!response.ok) {
            const message = extractErrorMessage(parsed, `Backend request failed with status ${response.status}.`);
            throw new BackendApiError(message, response.status, parsed);
        }

        return parsed as T;
    } catch (error) {
        if (error instanceof BackendApiError) throw error;
        if ((error as { name?: string })?.name === "AbortError") {
            throw new BackendApiError("Backend request was aborted or timed out.", 504, null);
        }
        const message = error instanceof Error ? error.message : "Unknown backend error.";
        throw new BackendApiError(message, 500, null);
    } finally {
        clearTimeout(timer);
    }
};

export const isBackendConfigured = (): boolean => {
    try {
        resolveBaseUrl();
        return true;
    } catch {
        return false;
    }
};
