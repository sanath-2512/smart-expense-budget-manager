import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const allowedOrigins = [
  process.env["APP_ORIGIN"],
  process.env["APP_ORIGIN"]?.replace(/\/$/, ""),
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].filter((value): value is string => Boolean(value));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const corsOptions = {
  origin: function (origin: string | undefined, callback: any) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled API error");
  const errorText = String(err);
  const cause = (err as { cause?: unknown } | null)?.cause;
  const causeText = String(cause ?? "");
  const causeErrors = Array.isArray((cause as { errors?: unknown[] } | null)?.errors)
    ? ((cause as { errors: unknown[] }).errors ?? []).map((item) => String(item)).join(" ")
    : "";
  const combinedErrorText = `${errorText} ${causeText} ${causeErrors}`;
  const isDatabaseUnavailable = combinedErrorText.includes("ECONNREFUSED");
  const isSchemaMissing =
    combinedErrorText.includes('relation "users" does not exist') ||
    combinedErrorText.includes('relation "budgets" does not exist');

  if (isDatabaseUnavailable) {
    res.status(503).json({
      error: "Database unavailable",
      message: "Database connection failed. Start PostgreSQL and run schema push before using auth features.",
    });
    return;
  }

  if (isSchemaMissing) {
    res.status(503).json({
      error: "Database schema not initialized",
      message: "Run schema push/migrations before using the application.",
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env["NODE_ENV"] === "development" ? combinedErrorText : undefined,
  });
});

export default app;
