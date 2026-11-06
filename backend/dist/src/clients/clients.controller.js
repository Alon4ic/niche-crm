"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientsController", {
    enumerable: true,
    get: function() {
        return ClientsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _clientsservice = require("./clients.service");
const _createclientdto = require("./dto/create-client.dto");
const _updateclientdto = require("./dto/update-client.dto");
const _client = require("@prisma/client");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ClientsController = class ClientsController {
    create(tenantId, dto) {
        return this.clientsService.create(tenantId, dto);
    }
    findAll(tenantId) {
        return this.clientsService.findAll(tenantId);
    }
    findOne(tenantId, id) {
        return this.clientsService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.clientsService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.clientsService.remove(tenantId, id);
    }
    constructor(clientsService){
        this.clientsService = clientsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _createclientdto.CreateClientDto === "undefined" ? Object : _createclientdto.CreateClientDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ClientsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ClientsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ClientsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(":id"),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _updateclientdto.UpdateClientDto === "undefined" ? Object : _updateclientdto.UpdateClientDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ClientsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.HttpCode)(204),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)("id")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ClientsController.prototype, "remove", null);
ClientsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)("clients"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _clientsservice.ClientsService === "undefined" ? Object : _clientsservice.ClientsService
    ])
], ClientsController);

//# sourceMappingURL=clients.controller.js.map