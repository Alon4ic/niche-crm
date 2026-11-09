/** Возвраты: годные на склад, брак, превышение, срок, права. */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/app';
import { PrismaClient } from "@prisma/client";
import {
  createClient,
  createDeal,
  createShippedDeal,
  createStockItem,
  createTenant,
  getReturns,
  getStock,
  patchSettings,
  postReturn,
  returnBody,
  reserve,
  addBom,
  setStage,
  TestTenant,
} from './helpers/api';
const prisma = new PrismaClient();

describe('Возвраты', () => {
  let app: INestApplication;
  let t: TestTenant;
  let clientId: string;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    t = await createTenant(app, 'Returns');
    token = t.owner.token;
    clientId = await createClient(app, token);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it("по истечении срока возврат отклоняется с кодом RETURN_WINDOW_EXPIRED", async () => {
    const { stock, dealId } = await shipped();
    await prisma.$executeRaw`UPDATE "Deal" SET "closedAt" = now() - interval '20 days' WHERE id = ${dealId}`;

    const res = await postReturn(
      app,
      token,
      dealId,
      returnBody(stock, 1, "RESTOCK"),
    );
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("RETURN_WINDOW_EXPIRED");
  });
  // отгружено 10 из 100: на складе 90
  const shipped = async () => {
    const stock = await createStockItem(app, token, { quantityOnHand: 100 });
    const dealId = await createShippedDeal(app, token, clientId, stock, 10);
    return { stock, dealId };
  };

  it('сведения о возврате: доступен, можно вернуть всё отгруженное', async () => {
    const { dealId } = await shipped();
    const res = await getReturns(app, token, dealId);
    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(true);
    expect(Number(res.body.lines[0].returnable)).toBe(10);
  });

  it('MEMBER не оформляет возвраты, но видит информацию', async () => {
    const { stock, dealId } = await shipped();
    expect((await postReturn(app, t.member.token, dealId, returnBody(stock, 1, 'RESTOCK'))).status).toBe(403);
    expect((await getReturns(app, t.member.token, dealId)).status).toBe(200);
  });

  it('годные возвращаются на склад, брак склад не меняет', async () => {
    const { stock, dealId } = await shipped();

    expect((await postReturn(app, t.admin.token, dealId, returnBody(stock, 3, 'RESTOCK'))).status).toBe(201);
    expect((await getStock(app, token, stock)).onHand).toBe(93);

    expect((await postReturn(app, token, dealId, returnBody(stock, 2, 'WRITE_OFF'))).status).toBe(201);
    expect((await getStock(app, token, stock)).onHand).toBe(93);
  });

  it('нельзя вернуть больше, чем осталось (частичные возвраты суммируются)', async () => {
    const { stock, dealId } = await shipped();
    await postReturn(app, token, dealId, returnBody(stock, 3, 'RESTOCK'));
    await postReturn(app, token, dealId, returnBody(stock, 2, 'WRITE_OFF'));

    const res = await postReturn(app, token, dealId, returnBody(stock, 6, 'RESTOCK')); // осталось 5
    expect(res.status).toBe(409);
    expect((await getStock(app, token, stock)).onHand).toBe(93);
  });

  it('позиция, которой не было в отгрузке, отклоняется', async () => {
    const { dealId } = await shipped();
    const foreign = await createStockItem(app, token);
    expect((await postReturn(app, token, dealId, returnBody(foreign, 1, 'RESTOCK'))).status).toBe(400);
  });

  it('по проигранной сделке возврат невозможен', async () => {
    const stock = await createStockItem(app, token);
    const dealId = await createDeal(app, token, clientId);
    await addBom(app, token, dealId, stock, 1);
    await reserve(app, token, dealId);
    await setStage(app, token, dealId, 'LOST');

    expect((await postReturn(app, token, dealId, returnBody(stock, 1, 'RESTOCK'))).status).toBe(409);
  });

  it('при сроке возврата 0 дней возврат отклоняется с кодом, после восстановления срока проходит', async () => {
    const { stock, dealId } = await shipped();

    await patchSettings(app, token, { returnWindowDays: 0 }).expect(200);
    const denied = await postReturn(app, token, dealId, returnBody(stock, 1, 'RESTOCK'));
    expect(denied.status).toBe(409);
    expect(denied.body.code).toBe("RETURNS_DISABLED");

    await patchSettings(app, token, { returnWindowDays: 14 }).expect(200);
    expect((await postReturn(app, token, dealId, returnBody(stock, 1, 'RESTOCK'))).status).toBe(201);
  });

  it('срок возврата вне диапазона 0–365 не сохраняется', async () => {
    expect((await patchSettings(app, token, { returnWindowDays: 400 })).status).toBe(400);
    expect((await patchSettings(app, token, { returnWindowDays: -1 })).status).toBe(400);
  });
});
