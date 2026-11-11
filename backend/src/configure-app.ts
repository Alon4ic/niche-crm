import { INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import cookieParser from "cookie-parser";
import type { Express } from "express";

export function configureApp(app: INestApplication): INestApplication {
  const proxyHops = Number(process.env.TRUST_PROXY ?? 0);
  if (proxyHops > 0) {
    (app.getHttpAdapter().getInstance() as Express).set("trust proxy", proxyHops);
  } 

  app.use(helmet());
  app.use(cookieParser());

  const corsOrigins = (
    process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  return app;
}
