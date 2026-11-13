export function validateEnv(config:Record<string, unknown>) {
    const errors: string[] = [];
    if (!config.DATABASE_URL) {
        errors.push("DATABASE_URL is required");
    }

    const secret = config.JWT_ACCESS_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
        errors.push('JWT_ACCESS_SECRET must be at least 32 characters (generate: openssl rand -hex 32)');
    } else if (config.NODE_ENV === 'production' && secret.includes('change-in-production')) {
        errors.push('JWT_ACCESS_SECRET still has the placeholder value');
    }

    if (
      config.NODE_ENV === "production" &&
      !String(config.CORS_ORIGINS ?? "").trim()
    ) {
      errors.push("CORS_ORIGINS is required in production");
    }

    if (errors.length > 0) {
        throw new Error(`Invvalid environment configuration:\n - ${errors.join('\n - ')}`);
    }
    return config;
}