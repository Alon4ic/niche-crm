import { Transform } from "class-transformer";

export const Trim = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export const TrimToUndefined = () =>
    Transform(({ value }) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
    });

export const NormalizeEmail = () =>
    Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));