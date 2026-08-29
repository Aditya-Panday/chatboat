import { Prisma } from "@prisma/client";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiListResponse<T> = {
  success: true;
  data: T[];
  pagination: PaginationMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }

  static rateLimited(message = "Too many attempts. Please try again later.") {
    return new ApiError(429, "RATE_LIMITED", message);
  }

  static internal(message = "An unexpected error occurred.") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}

export function success<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function listSuccess<T>(
  data: T[],
  pagination: PaginationMeta,
): ApiListResponse<T> {
  return { success: true, data, pagination };
}

export function errorResponse(error: ApiError): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
}

export function isPrismaUniqueViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
