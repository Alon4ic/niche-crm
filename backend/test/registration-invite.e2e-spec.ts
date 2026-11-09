import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { createTestApp } from "./helpers/app";
// ... твои импорты создания приложения, как в других spec-файлах

const CODE = "secret-demo-code";
let app: INestApplication;
let n = 0;

const registerBody = (extra: object = {}) => {
  const id = `${Date.now()}-${process.pid}-${n++}`;
  return {
    email: `test.${id}.invite@example.com`,
    password: "password123",
    tenantName: `Test invite ${id}`, // префикс "Test " нужен для очистки в global-setup
    ...extra,
  };
};
const http = () => request(app.getHttpServer());

describe("Registration invite code", () => {
  beforeAll(async () => {
    process.env.REGISTRATION_INVITE_CODE = CODE;
    app = await createTestApp(); // как в других spec-файлах
  });
  afterAll(async () => {
    delete process.env.REGISTRATION_INVITE_CODE;
    await app.close();
  });

  it("rejects registration without a code", async () => {
    const body = registerBody();
    const res = await http().post("/auth/register").send(body);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("INVALID_INVITE_CODE");
    // отказ случился ДО записи в БД: такого пользователя не существует
    await http()
      .post("/auth/login")
      .send({ email: body.email, password: body.password })
      .expect(401);
  });

  it("rejects a wrong code", async () => {
    const res = await http()
      .post("/auth/register")
      .send(registerBody({ inviteCode: "nope" }));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("INVALID_INVITE_CODE");
  });

  it("accepts the correct code, ignoring surrounding spaces", async () => {
    const res = await http()
      .post("/auth/register")
      .send(registerBody({ inviteCode: `  ${CODE}  ` }));
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  it("reports that an invite is required", async () => {
    const res = await http().get("/auth/registration-info");
    expect(res.body).toEqual({ inviteRequired: true });
  });

  it("is open when the env variable is empty", async () => {
    process.env.REGISTRATION_INVITE_CODE = "";
    try {
      await http().post("/auth/register").send(registerBody()).expect(201);
      const info = await http().get("/auth/registration-info");
      expect(info.body).toEqual({ inviteRequired: false });
    } finally {
      process.env.REGISTRATION_INVITE_CODE = CODE;
    }
  });
});
