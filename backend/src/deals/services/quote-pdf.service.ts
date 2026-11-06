import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface QuoteBomLine {
    name: string;
    sku: string;
    quantity: string;
    unitCostSnapshot: string;
}

interface QuoteData {
    dealTitle: string;
    clientName: string;
    currency: string;
    createdAt: Date;
    bomItems: QuoteBomLine[];
    totalCost: number;
}

@Injectable()
export class QuotePdfService {
    generate(data: QuoteData, res: Response) {
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="quote-${data.dealTitle}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('Commercial Proposal', { align: 'center' });
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
        for (const item of data.bomItems) {
            const lineTotal = Number(item.quantity) * Number(item.unitCostSnapshot);
            doc.text(item.name, 50, y);
            doc.text(item.sku, 220, y);
            doc.text(item.quantity, 300, y);
            doc.text(item.unitCostSnapshot, 370, y);
            doc.text(lineTotal.toFixed(2), 460, y);
            y += 20;
        }

        doc.moveDown(3);
        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(`Total: ${data.currency} ${data.totalCost.toFixed(2)}`, { align: 'right'});

        doc.end();
    }
}