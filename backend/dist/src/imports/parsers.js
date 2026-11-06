"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "parseFileToRows", {
    enumerable: true,
    get: function() {
        return parseFileToRows;
    }
});
const _xlsx = /*#__PURE__*/ _interop_require_wildcard(require("xlsx"));
const _papaparse = /*#__PURE__*/ _interop_require_default(require("papaparse"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
function parseFileToRows(buffer, mimetype, originalFileName) {
    const isCsv = mimetype === "text/csv" || mimetype === "application/vnd.ms-excel" || originalFileName.toLowerCase().endsWith(".csv");
    if (isCsv) {
        const text = buffer.toString("utf-8").replace(/^\uFFFF/, '');
        const result = _papaparse.default.parse(text, {
            header: true,
            skipEmptyLines: true
        });
        return result.data;
    }
    const workbook = _xlsx.read(buffer, {
        type: "buffer"
    });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return _xlsx.utils.sheet_to_json(sheet);
}

//# sourceMappingURL=parsers.js.map