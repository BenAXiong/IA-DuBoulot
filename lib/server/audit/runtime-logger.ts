import "server-only";

type RuntimeLogLevel = "info" | "error";

type RuntimeLogPayload = {
  message: string;
  requestId?: string;
  route?: string;
  method?: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  errorCode?: string;
  provider?: string;
  targetStudentUserId?: string | null;
  details?: Record<string, unknown>;
};

function writeLog(level: RuntimeLogLevel, payload: RuntimeLogPayload) {
  const line = JSON.stringify({
    level,
    ...payload,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  console.info(line);
}

export function logRuntimeInfo(payload: RuntimeLogPayload) {
  writeLog("info", payload);
}

export function logRuntimeError(payload: RuntimeLogPayload) {
  writeLog("error", payload);
}
