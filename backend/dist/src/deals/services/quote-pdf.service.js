"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QuotePdfService", {
    enumerable: true,
    get: function() {
        return QuotePdfService;
    }
});
const _common = require("@nestjs/common");
const _pdfkit = /*#__PURE__*/ _interop_require_default(require("pdfkit"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
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
let QuotePdfService = class QuotePdfService {
    generate(data, res) {
        const doc = new _pdfkit.default({
            margin: 50
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="quote-${data.dealTitle}.pdf`);
        doc.pipe(res);
        doc.fontSize(20).text('Commercial Proposal', {
            align: 'center'
        });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Client: ${data.clientName}`);
        doc.text(`Deal: ${data.dealTitle}`);
        doc.text(`Date: ${data.createdAt.toLocaleDateString()}`);
        doc.moveDown();
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('SKU', 220, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Unit cost', 370, tableTop);
        doc.text('Total', 460, tableTop);
        doc.font('Helvetica');
        let y = tableTop + 20;
        for (const item of data.bomItems){
            const lineTotal = Number(item.quantity) * Number(item.unitCostSnapshot);
            doc.text(item.name, 50, y);
            doc.text(item.sku, 220, y);
            doc.text(item.quantity, 300, y);
            doc.text(item.unitCostSnapshot, 370, y);
            doc.text(lineTotal.toFixed(2), 460, y);
            y += 20;
        }
        doc.moveDown(3);
        doc.font('Helvetica-Bold').fontSize(14).text(`Total: ${data.currency} ${data.totalCost.toFixed(2)}`, {
            align: 'right'
        });
        doc.end();
    }
};
QuotePdfService = _ts_decorate([
    (0, _common.Injectable)()
], QuotePdfService);

//# sourceMappingURL=quote-pdf.service.js.map