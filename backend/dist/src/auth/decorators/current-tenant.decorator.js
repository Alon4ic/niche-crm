"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CurrentTenant", {
    enumerable: true,
    get: function() {
        return CurrentTenant;
    }
});
const _common = require("@nestjs/common");
const CurrentTenant = (0, _common.createParamDecorator)((_data, ctx)=>{
    const request = ctx.switchToHttp().getRequest();
    return request.user.tenantId;
});

//# sourceMappingURL=current-tenant.decorator.js.map