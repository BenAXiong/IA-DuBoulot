import "server-only";

import { NextResponse } from "next/server";
import { AppError, isAppError } from "@/lib/server/errors/app-error";
import { logRuntimeError } from "@/lib/server/audit/runtime-logger";

function fallbackError() {
  return new AppError({
    code: "internal_error",
    message: "An unexpected server error occurred.",
    status: 500,
    retryable: false,
  });
}

export function toErrorResponse(error: unknown, requestId: string) {
  const appError = isAppError(error) ? error : fallbackError();

  if (!isAppError(error)) {
    logRuntimeError({
      message: "Unhandled route error",
      requestId,
      errorCode: "internal_error",
      details: {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { value: String(error) },
      },
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.message,
        requestId,
        retryable: appError.retryable,
        ...(appError.fieldErrors ? { fieldErrors: appError.fieldErrors } : {}),
      },
    },
    {
      status: appError.status,
    },
  );
}
