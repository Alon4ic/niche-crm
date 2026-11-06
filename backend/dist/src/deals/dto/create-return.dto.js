"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateReturnDto () {
        return CreateReturnDto;
    },
    get ReturnItemDto () {
        return ReturnItemDto;
    }
});
const _classtransformer = require("class-transformer");
const _classvalidator = require("class-validator");
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
let ReturnItemDto = class ReturnItemDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], ReturnItemDto.prototype, "stockItemId", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)({
        maxDecimalPlaces: 3
    }),
    (0, _classvalidator.Min)(0.001),
    _ts_metadata("design:type", Number)
], ReturnItemDto.prototype, "quantity", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_client.ReturnDisposition),
    _ts_metadata("design:type", typeof _client.ReturnDisposition === "undefined" ? Object : _client.ReturnDisposition)
], ReturnItemDto.prototype, "disposition", void 0);
let CreateReturnDto = class CreateReturnDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(500),
    _ts_metadata("design:type", String)
], CreateReturnDto.prototype, "reason", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>ReturnItemDto),
    _ts_metadata("design:type", Array)
], CreateReturnDto.prototype, "items", void 0);

//# sourceMappingURL=create-return.dto.js.map