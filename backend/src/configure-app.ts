import { INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import cookieParser from "cookie-parser";

export function configureApp(app: INestApplication): INestApplication {
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
