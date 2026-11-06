/**
 * Конкурентные запросы. Два запроса уходят одновременно (Promise.all), и база должна
 * гарантировать, что итог корректен независимо от того, какой пришёл первым.
 * Если тест когда-нибудь станет «мигать» (то проходит, то нет), это не флак, а найденная гонка.
 */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/app';
import {
  createClient,
  createDealWithBom,
  createShippedDeal,
  createStockItem,
  createTenant,
  getStock,
  postReturn,
  returnBody,
  reserve,
  TestTenant,
} from './helpers/api';

const sorted = (statuses: number[]) => [...statuses].sort((a, b) => a - b);

describe('Конкурентные операции', () => {
  let app: INestApplication;
  let t: TestTenant;
  let clientId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    t = await createTenant(app, 'Race');
    token = t.owner.token;
    clientId = await createClient(app, token);
  });

  afterAll(async () => {
    await app.close();
  });

  it('два одновременных резерва одной сделки: один успех, один отказ', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 1);

    const results = await Promise.all([reserve(app, token, dealId), reserve(app, token, dealId)]);

    expect(sorted(results.map((r) => r.status))).toEqual([201, 409]);
    expect((await getStock(app, token, stock)).reserved).toBe(1);
  });

  it('последние единицы получает только одна из двух сделок', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 10 });
    const d1 = await createDealWithBom(app, token, clientId, stock, 6);
    const d2 = await createDealWithBom(app, token, clientId, stock, 6);

    const results = await Promise.all([reserve(app, token, d1.dealId), reserve(app, token, d2.dealId)]);

    const statuses = sorted(results.map((r) => r.status));
    expect(statuses[0]).toBe(201);
    expect([400, 409]).toContain(statuses[1]);
    // главное: зарезервировано 6 из 10, а не 12
    expect(await getStock(app, token, stock)).toEqual({ onHand: 10, reserved: 6, available: 4 });
  });

  it('два одновременных возврата, вместе превышающих остаток: проходит один', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const dealId = await createShippedDeal(app, token, clientId, stock, 10); // склад 90, вернуть можно 10

    const body = returnBody(stock, 6, 'RESTOCK'); // 6 + 6 > 10
    const results = await Promise.all([
      postReturn(app, token, dealId, body),
      postReturn(app, token, dealId, body),
    ]);

    expect(sorted(results.map((r) => r.status))).toEqual([201, 409]);
    expect((await getStock(app, token, stock)).onHand).toBe(96); // 90 + 6, а не 102
  });

  it('много одновременных резервов одной позиции не уводят резерв выше остатка', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 10 });
    const deals = await Promise.all(
      Array.from({ length: 5 }, () => createDealWithBom(app, token, clientId, stock, 3)),
    );

    const results = await Promise.all(deals.map((d) => reserve(app, token, d.dealId)));

    const ok = results.filter((r) => r.status === 201).length;
    expect(ok).toBe(3); // 3 × 3 = 9 ≤ 10, четвёртая уже не помещается
    const s = await getStock(app, token, stock);
    expect(s.reserved).toBe(9);
    expect(s.reserved).toBeLessThanOrEqual(s.onHand);
  });
});
