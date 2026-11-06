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
    get NormalizeEmail () {
        return NormalizeEmail;
    },
    get Trim () {
        return Trim;
    },
    get TrimToUndefined () {
        return TrimToUndefined;
    }
});
const _classtransformer = require("class-transformer");
const Trim = ()=>(0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim() : value);
const TrimToUndefined = ()=>(0, _classtransformer.Transform)(({ value })=>{
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
    });
const NormalizeEmail = ()=>(0, _classtransformer.Transform)(({ value })=>typeof value === 'string' ? value.trim().toLowerCase() : value);

//# sourceMappingURL=trim.transforms.js.map