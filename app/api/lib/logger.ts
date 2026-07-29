import pino from "pino";
import { env } from "./env";

const logger = pino({
  level: env.isProduction ? "info" : "debug",
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

export function createLogger(name: string) {
  return logger.child({ module: name });
}

export default logger;
