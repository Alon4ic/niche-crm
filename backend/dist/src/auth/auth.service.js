"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _argon2 = /*#__PURE__*/ _interop_require_wildcard(require("argon2"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _prismaservice = require("../prisma/prisma.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const ACCES_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;
let AuthService = class AuthService {
    async register(dto) {
        const existing = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (existing) {
            throw new _common.ConflictException('Email already registered');
        }
        const passwordHash = await _argon2.hash(dto.password);
        const tenant = await this.prisma.tenant.create({
            data: {
                name: dto.tenantName,
                users: {
                    create: {
                        email: dto.email,
                        passwordHash,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        role: 'OWNER'
                    }
                }
            },
            include: {
                users: true
            }
        });
        const user = tenant.users[0];
        return this.issueTokens(user.id, tenant.id, user.role);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await _argon2.verify(user.passwordHash, dto.password);
        if (!isPasswordValid) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        return this.issueTokens(user.id, user.tenantId, user.role);
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: {
                    gt: new Date()
                }
            },
            include: {
                user: true
            }
        });
        if (!stored) {
            throw new _common.UnauthorizedException('Invalid or expired refresh token');
        }
        await this.prisma.refreshToken.update({
            where: {
                id: stored.id
            },
            data: {
                revokedAt: new Date()
            }
        });
        return this.issueTokens(stored.user.id, stored.user.tenantId, stored.user.role);
    }
    async logout(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: {
                tokenHash,
                revokedAt: null
            },
            data: {
                revokedAt: new Date()
            }
        });
    }
    async issueTokens(userId, tenantId, role) {
        const payload = {
            sub: userId,
            tenantId,
            role
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: ACCES_TOKEN_TTL
        });
        const refreshToken = _crypto.randomBytes(40).toString('hex');
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
            }
        });
        return {
            accessToken,
            refreshToken
        };
    }
    hashToken(token) {
        return _crypto.createHash('sha256').update(token).digest('hex');
    }
    constructor(prisma, jwtService){
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map