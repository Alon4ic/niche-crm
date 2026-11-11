"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "assertEnv", {
    enumerable: true,
    get: function() {
        return assertEnv;
    }
});
const _common = require("@nestjs/common");
function assertEnv() {
    const log = new _common.Logger("Env");
    if (process.env.NODE_ENV !== "production") return;
    const required = [
        "DATABASE_URL",
        "JWT_ACCESS_SECRET",
        "CORS_ORIGINS"
    ];
    const missing = required.filter((k)=>!process.env[k]?.trim());
    if (missing.length) {
        throw new Error(`Missing required env variables: ${missing.join(", ")}`);
    }
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
        throw new Error("JWT_ACCESS_SECRET must be at least 32 characters");
    }
    if (!process.env.DATABASE_URL.includes("connection_limit")) {
        log.warn("DATABASE_URL has no connection_limit: Prisma pool size will depend on CPU count");
    }
    if (!process.env.TRUST_PROXY) {
        log.warn("TRUST_PROXY is not set: rate limiting will see the proxy IP, not the client IP");
    }
    if (!process.env.REGISTRATION_INVITE_CODE?.trim()) {
        log.warn("REGISTRATION_INVITE_CODE is empty: registration is OPEN to anyone");
    }
}

//# sourceMappingURL=assert-env.js.map