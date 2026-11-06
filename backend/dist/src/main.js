"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _appmodule = require("./app.module");
const _configureapp = require("./configure-app");
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    (0, _configureapp.configureApp)(app);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    _common.Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap(); // import { NestFactory } from '@nestjs/core';
 // import { AppModule } from './app.module';
 // import { Logger, ValidationPipe } from '@nestjs/common';
 // import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
 // import helmet from 'helmet';
 // async function bootstrap() {
 //   const app = await NestFactory.create(AppModule);
 //   app.use(helmet());
 //   const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
 //     .split(',')
 //     .map((origin) => origin.trim())
 //     .filter(Boolean);
 //   app.enableCors({ origin: corsOrigins });
 //   app.useGlobalPipes(
 //     new ValidationPipe({
 //       whitelist: true,
 //       transform: true,
 //       forbidNonWhitelisted: true,
 //     }),
 //   );
 //   app.useGlobalFilters(new PrismaExceptionFilter())
 //   const port = process.env.PORT || 3000;
 //   await app.listen(port);
 //   Logger.log(`🚀 Application is running on: http://localhost:${port}`);
 // }
 // bootstrap();

//# sourceMappingURL=main.js.map