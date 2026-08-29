import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api/response";

type ApiJson<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ClientApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = (await response.json()) as ApiJson<T>;

  if (!json.success) {
    throw new ClientApiError(
      response.status,
      json.error.code,
      json.error.message,
    );
  }

  return json.data;
}

export async function apiFetchList<T>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = await response.json();

  if (!json.success) {
    throw new ClientApiError(
      response.status,
      json.error.code,
      json.error.message,
    );
  }

  return {
    data: json.data as T[],
    pagination: json.pagination,
  };
}
