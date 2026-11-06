"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientsModule", {
    enumerable: true,
    get: function() {
        return ClientsModule;
    }
});
const _common = require("@nestjs/common");
const _clientsservice = require("./clients.service");
const _clientscontroller = require("./clients.controller");
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
let ClientsModule = class ClientsModule {
};
ClientsModule = _ts_decorate([
    (0, _common.Module)({
        providers: [
            _clientsservice.ClientsService
        ],
        controllers: [
            _clientscontroller.ClientsController
        ],
        exports: [
            _clientsservice.ClientsService
        ]
    })
], ClientsModule);

//# sourceMappingURL=clients.module.js.map