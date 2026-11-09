import * as XLSX from 'xlsx';
import { parseFileToRows } from '../../src/imports/parsers';

const csv = (text: string, bom = false) =>
  Buffer.concat([bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, 'utf-8')]);

describe('parseFileToRows', () => {
  const body = 'SKU;Name;Unit;Cost;Qty\nIM-1;Электрод 3 мм;pcs;1250,50;5 000\nIM-2;Item two;pcs;10;1\n';

  it('CSV: разделитель «;» определяется сам, значения читаются как строки', () => {
    const rows = parseFileToRows(csv(body), 'text/csv', 'stock.csv');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ SKU: 'IM-1', Name: 'Электрод 3 мм', Unit: 'pcs', Cost: '1250,50', Qty: '5 000' });
  });

  it('CSV: кириллица читается без искажений', () => {
    const rows = parseFileToRows(csv('Артикул,Наименование\nА-1,Електроди 3 мм\n'), 'text/csv', 'a.csv');
    expect(rows[0]).toEqual({ Артикул: 'А-1', Наименование: 'Електроди 3 мм' });
  });

  it('CSV: BOM в начале файла (так сохраняет Excel) не попадает в имя первой колонки', () => {
    const rows = parseFileToRows(csv(body, true), 'text/csv', 'stock.csv');
    expect(Object.keys(rows[0])[0]).toBe('SKU');
  });

  it('CSV определяется по расширению, даже если тип файла заявлен неверно', () => {
    const rows = parseFileToRows(csv(body), 'application/octet-stream', 'STOCK.CSV');
    expect(rows[0].SKU).toBe('IM-1');
  });

  it('CSV: пустые строки пропускаются', () => {
    const rows = parseFileToRows(csv('SKU,Name\nA,One\n\n\nB,Two\n'), 'text/csv', 'x.csv');
    expect(rows.map((r) => r.SKU)).toEqual(['A', 'B']);
  });

  it('XLSX: первая строка листа становится заголовками', () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Name', 'Cost'],
      ['X-1', 'Steel plate', 99.5],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const rows = parseFileToRows(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'stock.xlsx',
    );
    expect(rows).toEqual([{ SKU: 'X-1', Name: 'Steel plate', Cost: 99.5 }]);
  });
});
