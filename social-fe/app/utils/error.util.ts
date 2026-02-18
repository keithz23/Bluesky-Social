export function extractErrMsg(err: unknown): string {
  const anyErr = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const raw =
    anyErr?.response?.data?.message ||
    anyErr?.message ||
    "Something went wrong.";
  return Array.isArray(raw) ? raw.join(", ") : String(raw);
}
