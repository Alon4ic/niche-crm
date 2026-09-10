"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _prismamodule = require("./prisma/prisma.module");
const _authmodule = require("./auth/auth.module");
const _clientsmodule = require("./clients/clients.module");
const _stockitemsmodule = require("./stock-items/stock-items.module");
const _dealsmodule = require("./deals/deals.module");
const _contactsmodule = require("./contacts/contacts.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true
            }),
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _clientsmodule.ClientsModule,
            _stockitemsmodule.StockItemsModule,
            _dealsmodule.DealsModule,
            _contactsmodule.ContactsModdule
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map