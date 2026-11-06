/**
 * Изоляция компаний: токен компании B не должен видеть и менять ничего из компании A.
 * Ожидаем 404 (не 403): сервер не выдаёт, что такая запись вообще существует.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createClient, createDeal, createStockItem, createTenant, TestTenant } from './helpers/api';


describe('Изоляция между компаниями', () => {
  let app: INestApplication;
  let a: TestTenant;
  let b: TestTenant;
  let clientId: string;
  let stockId: string;
  let dealId: string;
  let contactId: string;

  beforeAll(async () => {
    app = await createTestApp();
    a = await createTenant(app, 'Iso A');
    b = await createTenant(app, 'Iso B');
    clientId = await createClient(app, a.owner.token);
    stockId = await createStockItem(app, a.owner.token);
    dealId = await createDeal(app, a.owner.token, clientId);
    const c = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${a.owner.token}`)
      .send({ fullName: 'Contact A', clientId })
      .expect(201);
    contactId = c.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const cases: [string, string, (self: any) => string, object?][] = [
    ['GET', 'клиент', (s) => `/clients/${s.clientId}`],
    ['PATCH', 'клиент (изменение)', (s) => `/clients/${s.clientId}`, { name: 'Hacked' }],
    ['DELETE', 'клиент (удаление)', (s) => `/clients/${s.clientId}`],
    ['GET', 'контакт', (s) => `/contacts/${s.contactId}`],
    ['PATCH', 'контакт (изменение)', (s) => `/contacts/${s.contactId}`, { fullName: 'Hacked' }],
    ['DELETE', 'контакт (удаление)', (s) => `/contacts/${s.contactId}`],
    ['GET', 'складская позиция', (s) => `/stock-items/${s.stockId}`],
    ['PATCH', 'складская позиция (изменение)', (s) => `/stock-items/${s.stockId}`, { name: 'Hacked' }],
    ['DELETE', 'складская позиция (удаление)', (s) => `/stock-items/${s.stockId}`],
    ['GET', 'сделка', (s) => `/deals/${s.dealId}`],
    ['GET', 'себестоимость сделки', (s) => `/deals/${s.dealId}/cost`],
    ['GET', 'возвраты сделки', (s) => `/deals/${s.dealId}/returns`],
    ['PATCH', 'стадия сделки', (s) => `/deals/${s.dealId}/stage`, { stage: 'QUALIFIED' }],
    ['POST', 'резерв сделки', (s) => `/deals/${s.dealId}/reserve`],
    ['POST', 'снятие резерва', (s) => `/deals/${s.dealId}/release`],
    ['POST', 'спецификация сделки', (s) => `/deals/${s.dealId}/bom-items`, { stockItemId: '', quantity: 1 }],
  ];

  for (const [method, name, pathOf, body] of cases) {
    it(`${method} чужой объект: ${name} -> 404`, async () => {
      const self = { clientId, contactId, stockId, dealId };
      // для спецификации подставляем реальный id позиции чужой компании
      const payload: any = body ? { ...body } : undefined;
      if (payload && "stockItemId" in payload) payload.stockItemId = stockId;
      const res = await (request(app.getHttpServer()) as any)
        [method.toLowerCase()](pathOf(self))
        .set("Authorization", `Bearer ${b.owner.token}`)
        .send(payload ?? {});
      expect(res.status).toBe(404);
    });
  }
  it('нельзя создать сделку с чужим клиентом', async () => {
    await request(app.getHttpServer())
      .post('/deals')
      .set('Authorization', `Bearer ${b.owner.token}`)
      .send({ title: 'Steal', clientId, value: 1 })
      .expect(404);
  });

  it('списки компании B не содержат данных компании A', async () => {
    for (const path of ['/clients', '/contacts', '/stock-items', '/deals']) {
      const res = await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${b.owner.token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    }
  });

  it('данные компании A после попыток атаки не изменились', async () => {
    const res = await request(app.getHttpServer())
      .get(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${a.owner.token}`)
      .expect(200);
    expect(res.body.name).toBe('Test client');
  });
});
