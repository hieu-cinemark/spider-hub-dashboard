// Log files mix at least two shapes (ANSI may still leak if the API
// stripper missed a sequence):
//
//   structlog ConsoleRenderer (spider-hub's own logger):
//     2026-08-27 09:48:05 [info     ] [TIKTOK] [INFO] sending_request  endpoint=...
//
//   stdlib / Scrapy:
//     2026-08-27 16:48:16 [scrapy.core.engine] INFO: Spider opened
//
// Continuation lines (pretty-printed dicts, tracebacks) have no timestamp
// and belong to the previous entry. A line that matches neither prefix is
// still shown, just without a timestamp/level badge.

export type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

export interface ParsedLogLine {
  raw: string;
  timestamp: string | null;
  level: LogLevel | null;
  logger: string | null;
  platform: string | null;
  message: string;
  continuations: string[];
}

const ANSI_RE = /\u001b\[[0-9;]*m/g;

const STRUCTLOG_RE =
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[\s*(debug|info|warning|error|critical)\s*\]\s*(.*)$/i;

const PYTHON_RE =
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[([^\]]+)\]\s+(DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL)\s*:\s*(.*)$/i;

const PLATFORM_PREFIX_RE = /^\[([A-Za-z][A-Za-z0-9_]*)\]\s+(?:\[(SUCCESS|FAILED|WARNING|INFO|DEBUG|ERROR)\]\s+)?/;

const NOISY_LOGGER_RE =
  /^(aiokafka|urllib3|asyncio|redis|httpx|httpcore|scrapy\.utils\.log|scrapy\.addons|scrapy\.middleware|scrapy\.crawler)(\.|$)/i;

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, "");
}

// Telegram bot URLs and key=value secrets show up in crawl logs (urllib3
// request lines, structlog kv). Redact in the viewer so a shared screen
// doesn't leak credentials that happened to be logged.
export function redactLogText(text: string): string {
  return text
    .replace(/\/bot\d+:[A-Za-z0-9_-]+/g, "/bot***")
    .replace(/\b(cookie|password|passwd|token|secret|authorization|api[_-]?key)\s*[=:]\s*([^\s]+)/gi, "$1=***");
}

function normalizeLevel(value: string): LogLevel {
  const lower = value.toLowerCase();
  if (lower === "warn") return "warning";
  return lower as LogLevel;
}

const KNOWN_PLATFORMS = ["facebook", "threads", "tiktok", "instagram"] as const;

function extractPlatform(message: string): { platform: string | null; message: string } {
  const match = message.match(PLATFORM_PREFIX_RE);
  if (!match) return { platform: null, message };
  return { platform: match[1].toLowerCase(), message: message.slice(match[0].length).trim() };
}

function inferPlatform(message: string, logger: string | null, existing: string | null): string | null {
  if (existing && existing !== "system") return existing.toLowerCase();
  const { fields, event } = parseMessageFields(message);
  const fromField = (fields.platform || "").toLowerCase();
  if ((KNOWN_PLATFORMS as readonly string[]).includes(fromField)) return fromField;
  const hay = `${event} ${logger ?? ""} ${message}`.toLowerCase();
  for (const platform of KNOWN_PLATFORMS) {
    if (hay.includes(platform)) return platform;
  }
  return null;
}

export function parseLogLine(raw: string): ParsedLogLine {
  const cleaned = redactLogText(stripAnsi(raw).replace(/\r$/, ""));
  const empty: ParsedLogLine = {
    raw: cleaned,
    timestamp: null,
    level: null,
    logger: null,
    platform: null,
    message: cleaned,
    continuations: [],
  };
  if (!cleaned.trim()) return empty;

  const structMatch = cleaned.match(STRUCTLOG_RE);
  if (structMatch) {
    const { platform, message } = extractPlatform(structMatch[3].trim());
    const text = message || structMatch[3].trim();
    return {
      raw: cleaned,
      timestamp: structMatch[1],
      level: normalizeLevel(structMatch[2]),
      logger: null,
      platform: inferPlatform(text, null, platform),
      message: text,
      continuations: [],
    };
  }

  const pythonMatch = cleaned.match(PYTHON_RE);
  if (pythonMatch) {
    const message = pythonMatch[4];
    return {
      raw: cleaned,
      timestamp: pythonMatch[1],
      level: normalizeLevel(pythonMatch[3]),
      logger: pythonMatch[2],
      platform: inferPlatform(message, pythonMatch[2], null),
      message,
      continuations: [],
    };
  }

  return { ...empty, platform: inferPlatform(cleaned, null, null) };
}

export function parseLogLines(rawLines: string[]): ParsedLogLine[] {
  const entries: ParsedLogLine[] = [];
  for (const raw of rawLines) {
    const parsed = parseLogLine(raw);
    const isContinuation = parsed.timestamp === null && entries.length > 0;
    if (isContinuation) {
      const prev = entries[entries.length - 1];
      prev.continuations.push(parsed.raw);
      prev.raw = `${prev.raw}\n${parsed.raw}`;
      continue;
    }
    entries.push(parsed);
  }
  return entries;
}

export function isNoisyLog(line: ParsedLogLine): boolean {
  if (line.logger && NOISY_LOGGER_RE.test(line.logger)) return true;
  if (line.message.includes("api.telegram.org")) return true;
  return false;
}

export function formatLogClock(timestamp: string | null): string {
  if (!timestamp) return "";
  const time = timestamp.match(/(\d{2}:\d{2}:\d{2})/);
  return time ? time[1] : timestamp;
}

export function shortLogger(logger: string | null): string | null {
  if (!logger) return null;
  const parts = logger.split(".");
  return parts.length <= 2 ? logger : parts.slice(-2).join(".");
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
  info: "#818cf8",
  warning: "#faad14",
  error: "#ff4d4f",
  critical: "#ff4d4f",
};

export const DEFAULT_VISIBLE_LEVELS: LogLevel[] = ["info", "warning", "error", "critical"];

export interface PlatformLogHealth {
  errors: number;
  warnings: number;
  lastError: string | null;
}

export interface CrawlHealth {
  errorCount: number;
  warningCount: number;
  lastError: ParsedLogLine | null;
  byPlatform: Record<string, PlatformLogHealth>;
}

export function isFailureLevel(level: LogLevel | null): boolean {
  return level === "error" || level === "critical";
}

export function summarizeCrawlHealth(lines: ParsedLogLine[]): CrawlHealth {
  const byPlatform: Record<string, PlatformLogHealth> = {};
  let errorCount = 0;
  let warningCount = 0;
  let lastError: ParsedLogLine | null = null;

  for (const line of lines) {
    if (isFailureLevel(line.level)) {
      errorCount += 1;
      lastError = line;
      if (line.platform && line.platform !== "system") {
        const row = byPlatform[line.platform] ?? { errors: 0, warnings: 0, lastError: null };
        row.errors += 1;
        row.lastError = line.message;
        byPlatform[line.platform] = row;
      }
    } else if (line.level === "warning") {
      warningCount += 1;
      if (line.platform && line.platform !== "system") {
        const row = byPlatform[line.platform] ?? { errors: 0, warnings: 0, lastError: null };
        row.warnings += 1;
        byPlatform[line.platform] = row;
      }
    }
  }

  return { errorCount, warningCount, lastError, byPlatform };
}

export function parseMessageFields(message: string): { event: string; fields: Record<string, string> } {
  const trimmed = message.trim();
  const tokens = trimmed.split(/\s+/);
  const event = tokens[0] ?? "";
  const fields: Record<string, string> = {};
  for (const token of tokens.slice(1)) {
    const eq = token.indexOf("=");
    if (eq <= 0) continue;
    fields[token.slice(0, eq)] = token.slice(eq + 1).replace(/^['"]|['"]$/g, "");
  }
  return { event, fields };
}

export type CrawlKeywordState = "running" | "queued" | "done" | "failed";

export interface CrawlKeywordActivity {
  keyword: string;
  platform: string;
  state: CrawlKeywordState;
}

// Walks crawl_request_* events in log order. The consumer runs one keyword
// per platform at a time, so the latest started-without-finished keyword is
// "running"; anything started then finished/failed is settled. Kafka items
// not yet picked up never appear here - those come from the dashboard's
// own enqueue cache after a Collect click.
export function extractCrawlActivity(lines: ParsedLogLine[]): CrawlKeywordActivity[] {
  const byKey = new Map<string, CrawlKeywordActivity>();
  for (const line of lines) {
    const { event, fields } = parseMessageFields(line.message);
    const keyword = fields.keyword;
    const platform = (fields.platform || line.platform || "").toLowerCase();
    if (!keyword || !platform) continue;
    const key = `${platform}:${keyword}`;
    if (event === "crawl_request_started") {
      byKey.set(key, { keyword, platform, state: "running" });
      for (const [otherKey, row] of byKey) {
        if (row.platform === platform && otherKey !== key && row.state === "running") {
          row.state = "done";
        }
      }
    } else if (event === "crawl_request_finished") {
      byKey.set(key, { keyword, platform, state: "done" });
    } else if (event === "crawl_request_failed") {
      byKey.set(key, { keyword, platform, state: "failed" });
    }
  }
  return Array.from(byKey.values());
}
