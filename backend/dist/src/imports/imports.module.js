"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportsModule", {
    enumerable: true,
    get: function() {
        return ImportsModule;
    }
});
const _common = require("@nestjs/common");
const _importsservice = require("./imports.service");
const _importscontroller = require("./imports.controller");
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
let ImportsModule = class ImportsModule {
};
ImportsModule = _ts_decorate([
    (0, _common.Module)({
        providers: [
            _importsservice.ImportsService
        ],
        controllers: [
            _importscontroller.ImportsController
        ]
    })
], ImportsModule);

//# sourceMappingURL=imports.module.js.map