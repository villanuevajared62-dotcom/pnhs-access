const DEFAULT_UPLOAD_MAX_MB = 50;

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function getUploadMaxMB(): number {
  const fromEnv =
    parsePositiveNumber(process.env.UPLOAD_MAX_MB) ??
    parsePositiveNumber(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB);
  return Math.floor(fromEnv ?? DEFAULT_UPLOAD_MAX_MB);
}

export function getUploadMaxBytes(): number {
  return getUploadMaxMB() * 1024 * 1024;
}

