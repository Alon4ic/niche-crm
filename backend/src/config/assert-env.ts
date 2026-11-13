import { Logger } from "@nestjs/common";

export function assertEnv() {
    if (process.env.NODE_ENV !== "production") return;
        
    const log = new Logger("Env");
    
    if (!process.env.DATABASE_URL?.includes("connection_limit")) {
        log.warn("DATABASE_URL has no connection_limit: Prisma pool size will depend on CPU count");
    }
    if (!process.env.TRUST_PROXY) {
        log.warn("TRUST_PROXY is not set: rate limiting will see the proxy IP, not the client IP");
    }
    if (!process.env.REGISTRATION_INVITE_CODE?.trim()) {
        log.warn("REGISTRATION_INVITE_CODE is empty: registration is OPEN to anyone");
    }
}