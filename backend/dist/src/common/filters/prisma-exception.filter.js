"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrismaExceptionFilter", {
    enumerable: true,
    get: function() {
        return PrismaExceptionFilter;
    }
});
const _common = require("@nestjs/common");
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
let PrismaExceptionFilter = class PrismaExceptionFilter {
    catch(exception, host) {
        const response = host.switchToHttp().getResponse();
        const send = (statusCode, error, message)=>response.status(statusCode).json({
                statusCode,
                error,
                message
            });
        switch(exception.code){
            case 'P2002':
                {
                    this.logger.warn(`Unique constraint violated: ${JSON.stringify(exception.meta?.target)}`);
                    send(_common.HttpStatus.CONFLICT, 'Conflict', 'A record with the same qnique value already exists');
                    return;
                }
            case 'P2003':
                {
                    this.logger.warn(`Foreign key containt violated: ${JSON.stringify(exception.meta)}`);
                    send(_common.HttpStatus.CONFLICT, 'Conflict', 'This record is referenced by other data');
                    return;
                }
            case 'P2025':
                {
                    send(_common.HttpStatus.NOT_FOUND, 'Not Found', 'Record not found');
                    return;
                }
            default:
                {
                    this.logger.error(`Unhandled Prisma error ${exception.code}: ${exception.message}`, exception.stack);
                    send(_common.HttpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', 'Internal server error');
                }
        }
    }
    constructor(){
        this.logger = new _common.Logger(PrismaExceptionFilter.name);
    }
};
PrismaExceptionFilter = _ts_decorate([
    (0, _common.Catch)(_client.Prisma.PrismaClientKnownRequestError)
], PrismaExceptionFilter);

//# sourceMappingURL=prisma-exception.filter.js.map