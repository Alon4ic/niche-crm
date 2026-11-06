"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportsController", {
    enumerable: true,
    get: function() {
        return ImportsController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _multer = require("multer");
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
const _client = require("@prisma/client");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _rolesguard = require("../auth/guards/roles.guard");
const _rolesdecorator = require("../auth/decorators/roles.decorator");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _importsservice = require("./imports.service");
const _columnmappingdto = require("./dto/column-mapping.dto");
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
let ImportsController = class ImportsController {
    preview(file) {
        if (!file) {
            throw new _common.BadRequestException("No file uploaded");
        }
        return this.importsService.previewStockItems(file.buffer, file.mimetype, file.originalname);
    }
    async commit(tenantId, file, mappingRaw) {
        if (!file) {
            throw new _common.BadRequestException("No file uploadeed");
        }
        let parsedMapping;
        try {
            parsedMapping = JSON.parse(mappingRaw);
        } catch  {
            throw new _common.BadRequestException("Invalid mapping JSON");
        }
        const mapping = (0, _classtransformer.plainToInstance)(_columnmappingdto.StockItemColumnMappingDto, parsedMapping);
        const validationErrors = await (0, _classvalidator.validate)(mapping);
        if (validationErrors.length > 0) {
            throw new _common.BadRequestException("Invalid column mapping");
        }
        return this.importsService.commitStockItems(tenantId, file.buffer, file.mimetype, file.originalname, mapping);
    }
    getSavedMapping(tenantId, sourceType) {
        return this.importsService.getSavedMapping(tenantId, sourceType);
    }
    constructor(importsService){
        this.importsService = importsService;
    }
};
_ts_decorate([
    (0, _common.Post)("preview"),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file", {
        storage: (0, _multer.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    })),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File
    ]),
    _ts_metadata("design:returntype", void 0)
], ImportsController.prototype, "preview", null);
_ts_decorate([
    (0, _common.Post)("commit"),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("file", {
        storage: (0, _multer.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    })),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_param(2, (0, _common.Body)("mapping")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ImportsController.prototype, "commit", null);
_ts_decorate([
    (0, _common.Get)("mapping"),
    (0, _rolesdecorator.Roles)(_client.UserRole.OWNER, _client.UserRole.ADMIN),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Query)("sourceType")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _client.ImportSourceType === "undefined" ? Object : _client.ImportSourceType
    ]),
    _ts_metadata("design:returntype", void 0)
], ImportsController.prototype, "getSavedMapping", null);
ImportsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _common.Controller)("imports/stock-items"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _importsservice.ImportsService === "undefined" ? Object : _importsservice.ImportsService
    ])
], ImportsController);

//# sourceMappingURL=imports.controller.js.map