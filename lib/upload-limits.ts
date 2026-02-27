const DEFAULT_UPLOAD_MAX_MB = 50;

function parseUploadMaxMB(value: string | undefined): number | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (v === "unlimited" || v === "infinite" || v === "inf") return 0;
  const parsed = Number(v);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function getUploadMaxMB(): number {
  const fromEnv =
    parseUploadMaxMB(process.env.UPLOAD_MAX_MB) ??
    parseUploadMaxMB(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB);
  return Math.floor(fromEnv ?? DEFAULT_UPLOAD_MAX_MB);
}

export function getUploadMaxBytes(): number {
  const mb = getUploadMaxMB();
  if (mb === 0) return Number.POSITIVE_INFINITY;
  return mb * 1024 * 1024;
}
