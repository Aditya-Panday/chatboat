import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, errorResponse } from "@/lib/api/response";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(errorResponse(error), { status: error.status });
  }

  if (error instanceof ZodError) {
    const apiError = ApiError.badRequest("Invalid request.", error.flatten());
    return NextResponse.json(errorResponse(apiError), { status: 400 });
  }

  console.error("[api]", error);
  const apiError = ApiError.internal();
  return NextResponse.json(errorResponse(apiError), { status: 500 });
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonList<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  init?: ResponseInit,
) {
  return NextResponse.json({ success: true, data, pagination }, init);
}
