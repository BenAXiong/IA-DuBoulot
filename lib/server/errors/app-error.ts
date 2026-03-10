import "server-only";

export type AppErrorCode =
  | "bad_request"
  | "validation_error"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "provider_error"
  | "service_unavailable"
  | "internal_error";

export type AppErrorFieldErrors = Record<string, string>;

export class AppError extends Error {
  code: AppErrorCode;
  status: number;
  retryable: boolean;
  fieldErrors?: AppErrorFieldErrors;

  constructor(options: {
    code: AppErrorCode;
    message: string;
    status: number;
    retryable?: boolean;
    fieldErrors?: AppErrorFieldErrors;
    cause?: unknown;
  }) {
    super(options.message, options.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.fieldErrors = options.fieldErrors;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
