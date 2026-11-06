"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ContactsService", {
    enumerable: true,
    get: function() {
        return ContactsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let ContactsService = class ContactsService {
    async create(tenantId, dto) {
        const client = await this.prisma.client.findFirst({
            where: {
                id: dto.clientId,
                tenantId
            }
        });
        if (!client) {
            throw new _common.NotFoundException("Client not found");
        }
        return this.prisma.contact.create({
            data: {
                ...dto,
                tenantId
            }
        });
    }
    findAll(tenantId, clientId) {
        return this.prisma.contact.findMany({
            where: {
                tenantId,
                ...clientId ? {
                    clientId
                } : {}
            },
            include: {
                client: true
            }
        });
    }
    async findOne(tenantId, id) {
        const contact = await this.prisma.contact.findFirst({
            where: {
                id,
                tenantId
            }
        });
        if (!contact) {
            throw new _common.NotFoundException("Client not found");
        }
        return contact;
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        return this.prisma.contact.update({
            where: {
                id
            },
            data: dto
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.prisma.contact.delete({
            where: {
                id
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ContactsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ContactsService);

//# sourceMappingURL=contacts.service.js.map