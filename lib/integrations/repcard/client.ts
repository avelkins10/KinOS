/**
 * RepCard API client.
 * Base URL: https://app.repcard.com/api
 * Auth: x-api-key header
 */

import type {
  RepCardUser,
  RepCardUserMinimal,
  RepCardCustomer,
  RepCardCustomerAttachment,
  RepCardApiResponse,
  RepCardApiError,
} from "./types";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export class RepCardClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "RepCardClientError";
  }
}

export class RepCardClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const url =
      process.env.REPCARD_API_BASE_URL ?? "https://app.repcard.com/api";
    const key = process.env.REPCARD_API_KEY ?? "";
    this.baseUrl = url.replace(/\/$/, "");
    this.apiKey = key;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
    },
  ): Promise<T> {
    const url = new URL(
      `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
    );
    if (options?.query) {
      Object.entries(options.query).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
          url.searchParams.set(k, String(v));
        }
      });
    }

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
    };

    let lastError: Error | null = null;
    let backoff = INITIAL_BACKOFF_MS;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      try {
        const res = await fetch(url.toString(), {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const text = await res.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!res.ok) {
          const err: RepCardApiError | undefined =
            data && typeof data === "object" && "message" in data
              ? (data as RepCardApiError)
              : undefined;
          const message =
            err && typeof err.message === "string"
              ? err.message
              : res.statusText || "Request failed";
          const clientErr = new RepCardClientError(
            message,
            res.status,
            err?.code,
          );
          if (res.status >= 500 && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, backoff));
            backoff *= 2;
            continue;
          }
          throw clientErr;
        }

        return data as T;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof RepCardClientError) throw err;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, backoff));
          backoff *= 2;
        } else {
          throw lastError instanceof RepCardClientError
            ? lastError
            : new RepCardClientError(lastError?.message ?? "Request failed");
        }
      }
    }

    throw lastError ?? new RepCardClientError("Request failed");
  }

  /** Fetch a single page of users. */
  async getUsersPage(
    companyId: string,
    page: number,
    options?: { perPage?: number; search?: string },
  ): Promise<RepCardApiResponse<RepCardUserMinimal[]>> {
    const query: Record<string, string | number | undefined> = {
      company_id: companyId,
      per_page: options?.perPage ?? 100,
      page,
      search: options?.search,
    };
    const res = await this.request<
      RepCardApiResponse<RepCardUserMinimal[]> | RepCardUserMinimal[]
    >("GET", "/users/minimal", { query });
    if (Array.isArray(res)) {
      return {
        data: res,
        meta: {
          current_page: page,
          per_page: 100,
          total: res.length,
          total_pages: 1,
        },
      };
    }
    return res as RepCardApiResponse<RepCardUserMinimal[]>;
  }

  /** Fetch all users across all pages (paginates until total_pages exhausted). */
  async getAllUsers(
    companyId: string,
    options?: { perPage?: number; search?: string },
  ): Promise<RepCardUserMinimal[]> {
    const perPage = options?.perPage ?? 100;
    const accumulated: RepCardUserMinimal[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await this.getUsersPage(companyId, page, {
        ...options,
        perPage,
      });
      const data = response?.data ?? [];
      const meta = response?.meta;
      if (Array.isArray(data)) {
        accumulated.push(...(data as RepCardUserMinimal[]));
      }
      totalPages = meta?.total_pages ?? 1;
      page += 1;
    } while (page <= totalPages);

    return accumulated;
  }

  /** Single-page getUsers (kept for backward compatibility). Prefer getAllUsers for sync. */
  async getUsers(
    companyId: string,
    options?: { perPage?: number; search?: string },
  ): Promise<RepCardUserMinimal[]> {
    const response = await this.getUsersPage(companyId, 1, options);
    const data = response?.data ?? [];
    return Array.isArray(data) ? (data as RepCardUserMinimal[]) : [];
  }

  async getUserDetails(userId: number): Promise<RepCardUser> {
    const res = await this.request<
      RepCardApiResponse<RepCardUser> | RepCardUser
    >("GET", `/users/${userId}/details`);
    if (res && typeof res === "object" && "id" in res && "firstName" in res) {
      return res as RepCardUser;
    }
    return (res as RepCardApiResponse<RepCardUser>)?.data as RepCardUser;
  }

  async updateUser(
    userId: number,
    data: Partial<RepCardUser>,
  ): Promise<RepCardUser> {
    const res = await this.request<
      RepCardApiResponse<RepCardUser> | RepCardUser
    >("PUT", `/users/${userId}`, {
      body: data,
    });
    if (res && typeof res === "object" && "id" in res) {
      return res as RepCardUser;
    }
    return (res as RepCardApiResponse<RepCardUser>)?.data as RepCardUser;
  }

  async unlinkUser(userId: number): Promise<void> {
    await this.request<unknown>("POST", `/users/${userId}/unlink`);
  }

  async getCustomer(customerId: number): Promise<RepCardCustomer> {
    const res = await this.request<
      RepCardApiResponse<RepCardCustomer> | RepCardCustomer
    >("GET", `/customers/${customerId}`);
    if (res && typeof res === "object" && "id" in res && "firstName" in res) {
      return res as RepCardCustomer;
    }
    return (res as RepCardApiResponse<RepCardCustomer>)
      ?.data as RepCardCustomer;
  }

  async getCustomerAttachments(
    customerId: number,
    perPage?: number,
  ): Promise<RepCardCustomerAttachment[]> {
    const res = await this.request<
      | RepCardApiResponse<RepCardCustomerAttachment[]>
      | RepCardCustomerAttachment[]
    >("GET", `/customers/${customerId}/attachments`, {
      query: { per_page: perPage ?? 50 },
    });
    if (Array.isArray(res)) return res;
    return (res?.data ?? []) as RepCardCustomerAttachment[];
  }

  /**
   * Create customer in RepCard.
   * Endpoint is not yet documented in RepCard API; may 404 until confirmed.
   * Call only when REPCARD_CONTACT_PUSH_ENABLED=true and endpoint is verified.
   */
  async createCustomer(body: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    countryCode?: string;
  }): Promise<RepCardCustomer> {
    const res = await this.request<
      RepCardApiResponse<RepCardCustomer> | RepCardCustomer
    >("POST", "/customers", { body });
    if (res && typeof res === "object" && "id" in res && "firstName" in res) {
      return res as RepCardCustomer;
    }
    return (res as RepCardApiResponse<RepCardCustomer>)
      ?.data as RepCardCustomer;
  }
}

export const repCardClient = new RepCardClient();
