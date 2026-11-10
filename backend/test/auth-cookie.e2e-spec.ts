import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { createTestApp } from "./helpers/app";

let app: INestApplication;
let n = 0;
const http = () => request(app.getHttpServer());
const cookieOf = (res: request.Response) =>
  (res.headers["set-cookie"] as unknown as string[]).find((c) =>
    c.startsWith("refresh_token="),
  )!;
const pair = (setCookie: string) => setCookie.split(";")[0]; // "refresh_token=abc"

async function registerOne() {
  const id = `${Date.now()}-${process.pid}-${n++}`;
  return http()
    .post("/auth/register")
    .send({
      email: `test.${id}.cookie@example.com`,
      password: "password123",
      tenantName: `Test cookie ${id}`,
    });
}

describe("Refresh token cookie", () => {
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("sets an httpOnly cookie and keeps the token out of the body", async () => {
    const res = await registerOne().then((r) => r);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeUndefined();
    const c = cookieOf(res);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/Path=\/auth/i);
  });

  it("rotates the token: new cookie works, the old one is rejected", async () => {
    const reg = await registerOne();
    const oldCookie = pair(cookieOf(reg));

    const r1 = await http().post("/auth/refresh").set("Cookie", oldCookie);
    expect(r1.status).toBe(201);
    expect(r1.body.accessToken).toBeDefined();
    const newCookie = pair(cookieOf(r1));
    expect(newCookie).not.toBe(oldCookie);

    await http().post("/auth/refresh").set("Cookie", oldCookie).expect(401);
    await http().post("/auth/refresh").set("Cookie", newCookie).expect(201);
  });

  it("rejects refresh without a cookie", async () => {
    await http().post("/auth/refresh").expect(401);
  });

  it("logout revokes the token", async () => {
    const reg = await registerOne();
    const cookie = pair(cookieOf(reg));
    await http().post("/auth/logout").set("Cookie", cookie).expect(201);
    await http().post("/auth/refresh").set("Cookie", cookie).expect(401);
  });
});
