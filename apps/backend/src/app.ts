import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import apiRouter from "./routes";
import { notFoundHandler } from "./middleware/notFound.middleware";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware";

/**
 * Express application setup.
 * Tidak ada business logic di sini — hanya wiring middleware & routes.
 */
export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandlerMiddleware);

  return app;
}
