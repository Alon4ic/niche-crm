"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReturnsController", {
    enumerable: true,
    get: function() {
        return ReturnsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _returnsservice = require("./returns.service");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _client = require("@prisma/client");
const _currentuserdecorator = require("../auth/decorators/current-user.decorator");
const _createreturndto = require("./dto/create-return.dto");
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
let ReturnsController = class ReturnsController {
    list(tenantId, dealId) {
        return this.returnsService.list(tenantId, dealId);
    }
    create(tenantId, user, dealId, dto) {
        return this.returnsService.create(tenantId, user.sub, dealId, dto);
    }
    constructor(returnsService){
        this.returnsService = returnsService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('dealId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ReturnsController.prototype, "list", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(2, (0, _common.Param)('dealId')),
    _ts_param(3, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof JwtPayload === "undefined" ? Object : JwtPayload,
        String,
        typeof _createreturndto.CreateReturnDto === "undefined" ? Object : _createreturndto.CreateReturnDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ReturnsController.prototype, "create", null);
ReturnsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)('deals/:dealId/returns'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _returnsservice.ReturnsService === "undefined" ? Object : _returnsservice.ReturnsService
    ])
], ReturnsController);

//# sourceMappingURL=returns.controller.js.map