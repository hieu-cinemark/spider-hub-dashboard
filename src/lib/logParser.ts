// Both log files are structlog ConsoleRenderer output (ANSI already
// stripped server-side - see cinemark-api/app/api/routes/logs.py), shaped
// like:
//   2026-08-27T02:11:06.477Z [info     ] event_name    key=value key2=value2
//   2026-08-25 03:42:32 [info     ] [SYSTEM] [INFO] event_name key=value
// A line that doesn't match either prefix (a raw aiokafka error, a stray
// print) is still shown, just without a timestamp/level badge.

export type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

export interface ParsedLogLine {
  raw: string;
  timestamp: string | null;
  level: LogLevel | null;
  message: string;
}

const TIMESTAMP_RE = /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+/;
const LEVEL_RE = /^\[\s*(debug|info|warning|error|critical)\s*\]\s*/i;

export function parseLogLine(raw: string): ParsedLogLine {
  let rest = raw;
  let timestamp: string | null = null;
  let level: LogLevel | null = null;

  const tsMatch = rest.match(TIMESTAMP_RE);
  if (tsMatch) {
    timestamp = tsMatch[1];
    rest = rest.slice(tsMatch[0].length);
  }

  const levelMatch = rest.match(LEVEL_RE);
  if (levelMatch) {
    level = levelMatch[1].toLowerCase() as LogLevel;
    rest = rest.slice(levelMatch[0].length);
  }

  return { raw, timestamp, level, message: rest.trim() || raw };
}

export const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "default",
  info: "blue",
  warning: "gold",
  error: "red",
  critical: "red",
};

export const LEVEL_BORDER: Record<LogLevel, string> = {
  debug: "#8c8c8c",
  info: "#2f54eb",
  warning: "#faad14",
  error: "#ff4d4f",
  critical: "#ff4d4f",
};
