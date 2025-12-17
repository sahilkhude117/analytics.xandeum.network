import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiErrorResponse, ApiSuccessResponse } from "./types";

export function successResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    return errorResponse(
      "VALIDATION_ERROR",
      `Invalid ${firstError.path.join(".")}: ${firstError.message}`,
      400
    );
  }

  if (error instanceof Error) {
    return errorResponse("INTERNAL_ERROR", error.message, 500);
  }

  return errorResponse("UNKNOWN_ERROR", "An unexpected error occurred", 500);
}

export function buildCacheKey(parts: (string | number | object)[]): string {
  return parts
    .map((part) =>
      typeof part === "object" ? JSON.stringify(part) : String(part)
    )
    .join(":");
}
