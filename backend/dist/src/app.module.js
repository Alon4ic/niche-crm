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
const _usersmodule = require("./users/users.module");
const _importsmodule = require("./imports/imports.module");
const _settingsmodule = require("./settings/settings.module");
const _core = require("@nestjs/core");
const _throttler = require("@nestjs/throttler");
const _envvalidation = require("./config/env.validation");
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
let AppModule = class AppModule {
} // ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
;
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true,
                validate: _envvalidation.validateEnv
            }),
            _throttler.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: 300
                    }
                ],
                skipIf: ()=>process.env.NODE_ENV === "test"
            }),
            _prismamodule.PrismaModule,
            _authmodule.AuthModule,
            _clientsmodule.ClientsModule,
            _stockitemsmodule.StockItemsModule,
            _dealsmodule.DealsModule,
            _contactsmodule.ContactsModdule,
            _usersmodule.UsersModule,
            _importsmodule.ImportsModule,
            _settingsmodule.SettingsModule
        ],
        providers: [
            {
                provide: _core.APP_GUARD,
                useClass: _throttler.ThrottlerGuard
            }
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map