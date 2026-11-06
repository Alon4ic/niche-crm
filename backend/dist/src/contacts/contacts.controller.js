"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ContactsController", {
    enumerable: true,
    get: function() {
        return ContactsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _contactsservice = require("./contacts.service");
const _createcontactdto = require("./dto/create-contact.dto");
const _updatecontactdto = require("./dto/update-contact.dto");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _rolesguard = require("../auth/guards/roles.guard");
const _client = require("@prisma/client");
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
let ContactsController = class ContactsController {
    create(tenantId, dto) {
        return this.contactsService.create(tenantId, dto);
    }
    findAll(tenantId, clientId) {
        return this.contactsService.findAll(tenantId, clientId);
    }
    findOne(tenantId, id) {
        return this.contactsService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.contactsService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.contactsService.remove(tenantId, id);
    }
    constructor(contactsService){
        this.contactsService = contactsService;
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
        typeof _createcontactdto.CreateContactDto === "undefined" ? Object : _createcontactdto.CreateContactDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ContactsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Query)("clientId")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ContactsController.prototype, "findAll", null);
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
], ContactsController.prototype, "findOne", null);
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
        typeof _updatecontactdto.UpdateContactDto === "undefined" ? Object : _updatecontactdto.UpdateContactDto
    ]),
    _ts_metadata("design:returntype", void 0)
], ContactsController.prototype, "update", null);
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
], ContactsController.prototype, "remove", null);
ContactsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)("contacts"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _contactsservice.ContactsService === "undefined" ? Object : _contactsservice.ContactsService
    ])
], ContactsController);

//# sourceMappingURL=contacts.controller.js.map