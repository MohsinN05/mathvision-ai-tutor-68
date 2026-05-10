import { Request, Response, NextFunction } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error("Error:", err);
  const message = err instanceof Error ? err.message : String(err || "Internal error");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("users.findone() buffering timed out") ||
    normalized.includes("server selection") ||
    normalized.includes("econnrefused") ||
    normalized.includes("mongodb")
  ) {
    return res.status(503).json({
      ok: false,
      error: "Database unavailable. Start MongoDB and try again.",
    });
  }

  return res.status(500).json({ ok: false, error: message });
}
