"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "configureApp", {
    enumerable: true,
    get: function() {
        return configureApp;
    }
});
const _common = require("@nestjs/common");
const _helmet = /*#__PURE__*/ _interop_require_default(require("helmet"));
const _prismaexceptionfilter = require("./common/filters/prisma-exception.filter");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function configureApp(app) {
    app.use((0, _helmet.default)());
    const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:5174").split(",").map((origin)=>origin.trim()).filter(Boolean);
    app.enableCors({
        origin: corsOrigins
    });
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
    }));
    app.useGlobalFilters(new _prismaexceptionfilter.PrismaExceptionFilter());
    return app;
}

//# sourceMappingURL=configure-app.js.map