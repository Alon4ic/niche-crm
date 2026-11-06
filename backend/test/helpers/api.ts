import { INestApplication } from "@nestjs/common";
import request from "supertest";

export type Role = "OWNER" | "ADMIN" | "MEMBER";
export const ALL_ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER"];

export interface Account {
  email: string;
  token: string;
  role: Role;
}

export interface TestTenant {
  name: string;
  owner: Account;
  admin: Account;
  member: Account;
  byRole: Record<Role, Account>;
}

let counter = 0;
const uniq = () => `${Date.now()}-${process.pid}-${counter++}`;
const PASSWORD = "password123";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const http = (app: INestApplication) => request(app.getHttpServer());

/** Создаёт компанию с тремя сотрудниками (OWNER, ADMIN, MEMBER) через API. */
export async function createTenant(
  app: INestApplication,
  label = "A",
): Promise<TestTenant> {
  const id = uniq();
  const name = `Test ${label} ${id}`; // префикс "Test " нужен для очистки в global-setup

  const reg = await http(app)
    .post("/auth/register")
    .send({
      email: `test.${id}.owner@example.com`,
      password: PASSWORD,
      tenantName: name,
    })
    .expect(201);
  const owner: Account = {
    email: `test.${id}.owner@example.com`,
    token: reg.body.accessToken,
    role: "OWNER",
  };

  const make = async (role: "ADMIN" | "MEMBER"): Promise<Account> => {
    const email = `test.${id}.${role.toLowerCase()}@example.com`;
    await http(app)
      .post("/users")
      .set(auth(owner.token))
      .send({ email, password: PASSWORD, role })
      .expect(201);
    const login = await http(app)
      .post("/auth/login")
      .send({ email, password: PASSWORD })
      .expect(201);
    return { email, token: login.body.accessToken, role };
  };

  const admin = await make("ADMIN");
  const member = await make("MEMBER");
  return {
    name,
    owner,
    admin,
    member,
    byRole: { OWNER: owner, ADMIN: admin, MEMBER: member },
  };
}

// ---------- сущности ----------

export async function createClient(
  app: INestApplication,
  token: string,
  name = "Test client",
) {
  const res = await http(app)
    .post("/clients")
    .set(auth(token))
    .send({ name })
    .expect(201);
  return res.body.id as string;
}

export async function createStockItem(
  app: INestApplication,
  token: string,
  opts: { sku?: string; quantityOnHand?: number; unitCost?: number } = {},
) {
  const res = await http(app)
    .post("/stock-items")
    .set(auth(token))
    .send({
      sku: opts.sku ?? `SKU-${uniq()}`,
      name: "Test item",
      unit: "pcs",
      unitCost: opts.unitCost ?? 10,
      quantityOnHand: opts.quantityOnHand ?? 100,
    })
    .expect(201);
  return res.body.id as string;
}

export async function createDeal(
  app: INestApplication,
  token: string,
  clientId: string,
) {
  const res = await http(app)
    .post("/deals")
    .set(auth(token))
    .send({ title: "Test deal", clientId, value: 1000 })
    .expect(201);
  return res.body.id as string;
}

// ---------- действия со сделкой ----------
// Возвращают ответ целиком (status, body), чтобы тест сам проверял и успех, и отказ.

export const addBom = (
  app: INestApplication,
  token: string,
  dealId: string,
  stockItemId: string,
  quantity: number,
) =>
  http(app)
    .post(`/deals/${dealId}/bom-items`)
    .set(auth(token))
    .send({ stockItemId, quantity });

export const removeBom = (
  app: INestApplication,
  token: string,
  dealId: string,
  itemId: string,
) => http(app).delete(`/deals/${dealId}/bom-items/${itemId}`).set(auth(token));

export const reserve = (app: INestApplication, token: string, dealId: string) =>
  http(app).post(`/deals/${dealId}/reserve`).set(auth(token));

export const release = (app: INestApplication, token: string, dealId: string) =>
  http(app).post(`/deals/${dealId}/release`).set(auth(token));

export const setStage = (
  app: INestApplication,
  token: string,
  dealId: string,
  stage: string,
) => http(app).patch(`/deals/${dealId}/stage`).set(auth(token)).send({ stage });

export const getCost = (app: INestApplication, token: string, dealId: string) =>
  http(app).get(`/deals/${dealId}/cost`).set(auth(token));

export const patchStock = (
  app: INestApplication,
  token: string,
  id: string,
  data: object,
) => http(app).patch(`/stock-items/${id}`).set(auth(token)).send(data);

export const patchSettings = (
  app: INestApplication,
  token: string,
  data: object,
) => http(app).patch("/settings").set(auth(token)).send(data);

export const returnBody = (
  stockItemId: string,
  quantity: number,
  disposition: "RESTOCK" | "WRITE_OFF",
) => ({
  reason: "test",
  items: [{ stockItemId, quantity, disposition }],
});

export const postReturn = (
  app: INestApplication,
  token: string,
  dealId: string,
  body: object,
) => http(app).post(`/deals/${dealId}/returns`).set(auth(token)).send(body);

export const getReturns = (
  app: INestApplication,
  token: string,
  dealId: string,
) => http(app).get(`/deals/${dealId}/returns`).set(auth(token));

/** Числа складской позиции: на складе, в резерве, доступно. */
export async function getStock(
  app: INestApplication,
  token: string,
  id: string,
) {
  const res = await http(app)
    .get(`/stock-items/${id}`)
    .set(auth(token))
    .expect(200);
  return {
    onHand: Number(res.body.quantityOnHand),
    reserved: Number(res.body.quantityReserved),
    available: Number(res.body.quantityAvailable),
  };
}

/** Готовая отгруженная сделка: спецификация qty, резерв, выигрыш (склад списан). */
export async function createShippedDeal(
  app: INestApplication,
  token: string,
  clientId: string,
  stockItemId: string,
  quantity: number,
) {
  const dealId = await createDeal(app, token, clientId);
  const bom = await addBom(app, token, dealId, stockItemId, quantity);
  if (bom.status >= 300)
    throw new Error(`addBom ${bom.status} ${JSON.stringify(bom.body)}`);
  const res = await reserve(app, token, dealId);
  if (res.status !== 201)
    throw new Error(`reserve ${res.status} ${JSON.stringify(res.body)}`);
  const won = await setStage(app, token, dealId, "WON");
  if (won.status !== 200)
    throw new Error(`WON ${won.status} ${JSON.stringify(won.body)}`);
  return dealId;
}

/** Сделка со спецификацией, без резерва. Возвращает id сделки и id строки спецификации. */
export async function createDealWithBom(
  app: INestApplication,
  token: string,
  clientId: string,
  stockItemId: string,
  quantity: number,
) {
  const dealId = await createDeal(app, token, clientId);
  const bom = await addBom(app, token, dealId, stockItemId, quantity);
  if (bom.status >= 300)
    throw new Error(`addBom ${bom.status} ${JSON.stringify(bom.body)}`);
  return { dealId, bomId: bom.body.id as string };
}
