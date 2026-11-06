"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DealsController", {
    enumerable: true,
    get: function() {
        return DealsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _dealsservice = require("./deals.service");
const _createdealdto = require("./dto/create-deal.dto");
const _addbomitemdto = require("./dto/add-bom-item.dto");
const _updatestagedto = require("./dto/update-stage.dto");
const _adddealcontactdto = require("./dto/add-deal-contact.dto");
const _quotepdfservice = require("./services/quote-pdf.service");
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
let DealsController = class DealsController {
    create(tenantId, dto) {
        return this.dealsService.create(tenantId, dto);
    }
    findAll(tenantId) {
        return this.dealsService.findAll(tenantId);
    }
    getFunnelAnalitics(tenantId) {
        return this.dealsService.getFunnelAnalytics(tenantId);
    }
    findOne(tenantId, id) {
        return this.dealsService.findOne(tenantId, id);
    }
    updateStage(tenantId, id, dto) {
        return this.dealsService.updateStage(tenantId, id, dto.stage);
    }
    addBomItem(tenantId, id, dto) {
        return this.dealsService.addBomItem(tenantId, id, dto);
    }
    removeBomItem(tenantId, id, itemId) {
        return this.dealsService.removeBomItem(tenantId, id, itemId);
    }
    getCost(tenantId, id) {
        return this.dealsService.getCost(tenantId, id);
    }
    async getQuotePdf(tenantId, id, res) {
        const deal = await this.dealsService.findOne(tenantId, id);
        const cost = await this.dealsService.getCost(tenantId, id);
        this.quotePdfService.generate({
            dealTitle: deal.title,
            clientName: deal.client.name,
            currency: deal.currency,
            createdAt: deal.createdAt,
            bomItems: deal.bomItems.map((item)=>({
                    name: item.stockItem.name,
                    sku: item.stockItem.sku,
                    quantity: item.quantity.toString(),
                    unitCostSnapshot: item.unitCostSnapshot.toString()
                })),
            totalCost: cost.totalCost
        }, res);
    }
    reserveStock(tenantId, id) {
        return this.dealsService.reserveStock(tenantId, id);
    }
    releaseReservation(tenantId, id) {
        return this.dealsService.releaseReservation(tenantId, id);
    }
    addContact(tenantId, id, dto) {
        return this.dealsService.addContact(tenantId, id, dto);
    }
    removeContact(tenantId, id, contactId) {
        return this.dealsService.removeContact(tenantId, id, contactId);
    }
    constructor(dealsService, quotePdfService){
        this.dealsService = dealsService;
        this.quotePdfService = quotePdfService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _createdealdto.CreateDealDto === "undefined" ? Object : _createdealdto.CreateDealDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('analytics/funnel'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "getFunnelAnalitics", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id/stage'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _updatestagedto.UpdateStageDto === "undefined" ? Object : _updatestagedto.UpdateStageDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "updateStage", null);
_ts_decorate([
    (0, _common.Post)(':id/bom-items'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _addbomitemdto.AddBomItemDto === "undefined" ? Object : _addbomitemdto.AddBomItemDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "addBomItem", null);
_ts_decorate([
    (0, _common.Delete)(':id/bom-items/:itemId'),
    (0, _common.HttpCode)(204),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Param)('itemId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "removeBomItem", null);
_ts_decorate([
    (0, _common.Get)(':id/cost'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "getCost", null);
_ts_decorate([
    (0, _common.Get)(':id/quote'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof Response === "undefined" ? Object : Response
    ]),
    _ts_metadata("design:returntype", Promise)
], DealsController.prototype, "getQuotePdf", null);
_ts_decorate([
    (0, _common.Post)(':id/reserve'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "reserveStock", null);
_ts_decorate([
    (0, _common.Post)(':id/release'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "releaseReservation", null);
_ts_decorate([
    (0, _common.Post)(':id/contacts'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _adddealcontactdto.AddDealContactDto === "undefined" ? Object : _adddealcontactdto.AddDealContactDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "addContact", null);
_ts_decorate([
    (0, _common.Delete)(':id/contacts/:contactId'),
    (0, _common.HttpCode)(204),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Param)('contactId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DealsController.prototype, "removeContact", null);
DealsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('deals'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dealsservice.DealsService === "undefined" ? Object : _dealsservice.DealsService,
        typeof _quotepdfservice.QuotePdfService === "undefined" ? Object : _quotepdfservice.QuotePdfService
    ])
], DealsController);

//# sourceMappingURL=deals.controller.js.map