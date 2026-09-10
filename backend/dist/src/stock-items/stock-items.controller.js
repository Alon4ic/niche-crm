"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StockItemsController", {
    enumerable: true,
    get: function() {
        return StockItemsController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../auth/guards/jwt-auth.guard");
const _currenttenantdecorator = require("../auth/decorators/current-tenant.decorator");
const _stockitemsservice = require("./stock-items.service");
const _createstockitemdto = require("./dto/create-stock-item.dto");
const _upddatestockitemdto = require("./dto/upddate-stock-item.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let StockItemsController = class StockItemsController {
    create(tenantId, dto) {
        return this.stockItemsService.create(tenantId, dto);
    }
    findAll(tenantId) {
        return this.stockItemsService.findAll(tenantId);
    }
    findOne(tenantId, id) {
        return this.stockItemsService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.stockItemsService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.stockItemsService.remove(tenantId, id);
    }
    constructor(stockItemsService){
        this.stockItemsService = stockItemsService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _createstockitemdto.CreateStockItemDto === "undefined" ? Object : _createstockitemdto.CreateStockItemDto
    ]),
    _ts_metadata("design:returntype", void 0)
], StockItemsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], StockItemsController.prototype, "findAll", null);
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
], StockItemsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _upddatestockitemdto.UpdateStockItemDto === "undefined" ? Object : _upddatestockitemdto.UpdateStockItemDto
    ]),
    _ts_metadata("design:returntype", void 0)
], StockItemsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _currenttenantdecorator.CurrentTenant)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], StockItemsController.prototype, "remove", null);
StockItemsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('stock-items'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _stockitemsservice.StockItemsService === "undefined" ? Object : _stockitemsservice.StockItemsService
    ])
], StockItemsController);

//# sourceMappingURL=stock-items.controller.js.map