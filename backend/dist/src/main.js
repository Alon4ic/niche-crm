"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _appmodule = require("./app.module");
const _common = require("@nestjs/common");
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    const port = process.env.PORT || 3000;
    // Enable CORS since frontend will be on a different port (e.g. 5173 for Vite)
    app.enableCors();
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
    }));
    await app.listen(port);
    _common.Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();

//# sourceMappingURL=main.js.map