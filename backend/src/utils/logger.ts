type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = ["authorization", "password", "apikey", "token", "jwt", "secret"];

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitize(value);
    }
  }
  return sanitized;
}

export const logger = {
  format(level: LogLevel, message: string, context?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const meta = context ? ` ${JSON.stringify(sanitize(context))}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${meta}`;
  },

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== "test") {
      console.debug(this.format("debug", message, context));
    }
  },

  info(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== "test") {
      console.log(this.format("info", message, context));
    }
  },

  warn(message: string, context?: Record<string, any>) {
    console.warn(this.format("warn", message, context));
  },

  error(message: string, context?: Record<string, any>) {
    console.error(this.format("error", message, context));
  },
};
