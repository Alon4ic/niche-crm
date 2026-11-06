/**
 * Резерв, спецификация, стадии и списание.
 * Каждый тест создаёт свои данные, поэтому порядок тестов не важен.
 * Если имя кода ошибки у вас отличается (code в теле ответа), поправьте строку в нужном тесте.
 */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/app';
import {
  addBom,
  createClient,
  createDeal,
  createDealWithBom,
  createShippedDeal,
  createStockItem,
  createTenant,
  getCost,
  getStock,
  patchStock,
  release,
  removeBom,
  reserve,
  setStage,
  TestTenant,
} from './helpers/api';

describe('Резерв и спецификация', () => {
  let app: INestApplication;
  let t: TestTenant;
  let clientId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    t = await createTenant(app, 'Reserve');
    token = t.owner.token;
    clientId = await createClient(app, token);
  });

  afterAll(async () => {
    await app.close();
  });

  it('себестоимость считается по цене на момент добавления, а не по текущей', async () => {
    const stock = await createStockItem(app, token, { unitCost: 10, quantityOnHand: 100 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 10);
    expect(Number((await getCost(app, token, dealId)).body.totalCost)).toBe(100);

    await patchStock(app, token, stock, { unitCost: 20 }).expect(200);
    expect(Number((await getCost(app, token, dealId)).body.totalCost)).toBe(100);
  });

  it('резерв увеличивает «зарезервировано» и уменьшает «доступно», «на складе» не меняется', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 10);

    const res = await reserve(app, token, dealId);
    expect(res.status).toBe(201);

    expect(await getStock(app, token, stock)).toEqual({ onHand: 100, reserved: 10, available: 90 });
  });

  it('повторный резерв той же сделки отклоняется', async () => {
    const stock = await createStockItem(app, token);
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 5);
    expect((await reserve(app, token, dealId)).status).toBe(201);

    const again = await reserve(app, token, dealId);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('ALREADY_RESERVED');
    expect((await getStock(app, token, stock)).reserved).toBe(5);
  });

  it('при резерве нельзя менять спецификацию', async () => {
    const stock = await createStockItem(app, token);
    const { dealId, bomId } = await createDealWithBom(app, token, clientId, stock, 5);
    await reserve(app, token, dealId);

    expect((await addBom(app, token, dealId, stock, 1)).status).toBe(409);
    expect((await removeBom(app, token, dealId, bomId)).status).toBe(409);
  });

  it('нельзя уменьшить остаток ниже резерва', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 10);
    await reserve(app, token, dealId);

    const res = await patchStock(app, token, stock, { quantityOnHand: 5 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('STOCK_BELOW_RESERVED');
    expect((await getStock(app, token, stock)).onHand).toBe(100);
  });

  it('снятие резерва возвращает остаток, повторное снятие отклоняется', async () => {
    const stock = await createStockItem(app, token);
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 10);
    await reserve(app, token, dealId);

    expect([200, 201]).toContain((await release(app, token, dealId)).status);
    expect(await getStock(app, token, stock)).toEqual({ onHand: 100, reserved: 0, available: 100 });
    expect((await release(app, token, dealId)).status).toBe(400);
  });

  it('при нехватке остатков ничего не резервируется', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 5 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 50);

    const res = await reserve(app, token, dealId);
    expect([400, 409]).toContain(res.status);
    expect((await getStock(app, token, stock)).reserved).toBe(0);
  });

  it('всё или ничего: если одной позиции не хватает, вторая тоже не резервируется', async () => {
    const enough = await createStockItem(app, token, { quantityOnHand: 100 });
    const scarce = await createStockItem(app, token, { quantityOnHand: 1 });
    const dealId = await createDeal(app, token, clientId);
    await addBom(app, token, dealId, enough, 10);
    await addBom(app, token, dealId, scarce, 5);

    const res = await reserve(app, token, dealId);
    expect([400, 409]).toContain(res.status);
    expect((await getStock(app, token, enough)).reserved).toBe(0);
    expect((await getStock(app, token, scarce)).reserved).toBe(0);
  });
});

describe('Стадии сделки: выигрыш, проигрыш, списание', () => {
  let app: INestApplication;
  let t: TestTenant;
  let clientId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    t = await createTenant(app, 'Stages');
    token = t.owner.token;
    clientId = await createClient(app, token);
  });

  afterAll(async () => {
    await app.close();
  });

  it('выигрыш без резерва при наличии спецификации отклоняется', async () => {
    const stock = await createStockItem(app, token);
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 1);

    const res = await setStage(app, token, dealId, 'WON');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('STAGE_NEEDS_RESERVATION');
  });

  it('выигрыш списывает остаток и резерв', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    await createShippedDeal(app, token, clientId, stock, 10);
    expect(await getStock(app, token, stock)).toEqual({ onHand: 90, reserved: 0, available: 90 });
  });

  it('выигранную сделку со списанием нельзя вернуть в работу', async () => {
    const stock = await createStockItem(app, token);
    const dealId = await createShippedDeal(app, token, clientId, stock, 10);

    const res = await setStage(app, token, dealId, 'NEGOTIATION');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('WON_IS_FINAL');
    expect((await getStock(app, token, stock)).onHand).toBe(90);
  });

  it('закрытую сделку нельзя резервировать, её спецификация заморожена', async () => {
    const stock = await createStockItem(app, token);
    const dealId = await createShippedDeal(app, token, clientId, stock, 10);

    const res = await reserve(app, token, dealId);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DEAL_CLOSED');
    expect((await addBom(app, token, dealId, stock, 1)).status).toBe(409);
  });

  it('проигрыш снимает резерв', async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const { dealId } = await createDealWithBom(app, token, clientId, stock, 1);
    await reserve(app, token, dealId);
    expect((await getStock(app, token, stock)).reserved).toBe(1);

    expect((await setStage(app, token, dealId, 'LOST')).status).toBe(200);
    expect(await getStock(app, token, stock)).toEqual({ onHand: 100, reserved: 0, available: 100 });
  });

  it('сделку без спецификации можно выиграть и вернуть в работу', async () => {
    const dealId = await createDeal(app, token, clientId);
    expect((await setStage(app, token, dealId, 'WON')).status).toBe(200);
    expect((await setStage(app, token, dealId, 'NEGOTIATION')).status).toBe(200);
  });

  it('MEMBER может менять стадию (текущее решение, см. таблицу прав)', async () => {
    const dealId = await createDeal(app, t.member.token, clientId);
    expect((await setStage(app, t.member.token, dealId, 'QUALIFIED')).status).toBe(200);
  });
});
