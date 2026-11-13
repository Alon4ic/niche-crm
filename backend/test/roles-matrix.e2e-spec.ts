/**
 * Матрица «роль × маршрут».
 *
 * Идея: для КАЖДОГО маршрута приложения в таблице DECISIONS записано решение о доступе.
 *  - маршрута нет в таблице  -> тест падает (новый маршрут не может появиться «молча открытым»);
 *  - решение в таблице не совпадает с кодом (например, есть @Roles, но нет RolesGuard) -> тест падает;
 *  - для маршрутов с ограничением запрос «чужой» ролью реально получает 403, без токена 401.
 *
 * Защита срабатывает до валидации тела и до обработчика, поэтому достаточно пустого запроса и выдуманного id.
 */
// TODO: включить после починки helpers/app.ts и helpers/api.ts
import { INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import request from 'supertest';
import { createTestApp } from './helpers/app';
import { ALL_ROLES, createTenant, Role, TestTenant } from './helpers/api';
// Если ключ у вас называется иначе, поправьте импорт (в roles.decorator.ts: SetMetadata(ROLES_KEY, roles))
import { ROLES_KEY } from '../src/auth/decorators/roles.decorator';


type Decision = 'PUBLIC' | 'AUTH' | Role[];

const OA: Role[] = ['OWNER', 'ADMIN'];

// ЗАПОЛНЕНО по текущему поведению, которое проверяет smoke-test.sh. Это ВАШЕ решение о правах:
// первый прогон покажет маршруты, которых тут нет, и расхождения с кодом. Исправляйте таблицу или код осознанно.
const DECISIONS: Record<string, Decision> = {
  "POST /auth/register": "PUBLIC",
  "POST /auth/login": "PUBLIC",
  "POST /auth/refresh": "PUBLIC",
  "POST /auth/logout": "PUBLIC",
  "GET /auth/me": "AUTH",
  "GET /auth/registration-info": "PUBLIC",
  "GET /health": "PUBLIC",

  "GET /users": OA,
  "POST /users": ["OWNER"],

  "GET /settings": "AUTH",
  "PATCH /settings": ["OWNER"],

  "GET /clients": "AUTH",
  "GET /clients/:id": "AUTH",
  "POST /clients": OA,
  "PATCH /clients/:id": OA,
  "DELETE /clients/:id": OA,

  "GET /contacts": "AUTH",
  "GET /contacts/:id": "AUTH",
  "POST /contacts": OA,
  "PATCH /contacts/:id": OA,
  "DELETE /contacts/:id": OA,

  "GET /stock-items": "AUTH",
  "GET /stock-items/:id": "AUTH",
  "POST /stock-items": OA,
  "PATCH /stock-items/:id": OA,
  "DELETE /stock-items/:id": OA,

  // Сделки: сейчас любой вошедший (MEMBER создаёт сделки, меняет стадии, резервирует).
  // Открытое решение: нужно ли ограничить выигрыш и снятие резерва.
  "GET /deals": "AUTH",
  "GET /deals/analytics/funnel": "AUTH",
  "GET /deals/:id": "AUTH",
  "POST /deals": "AUTH",
  "PATCH /deals/:id/stage": "AUTH",
  "POST /deals/:id/bom-items": "AUTH",
  "DELETE /deals/:id/bom-items/:itemId": "AUTH",
  "GET /deals/:id/cost": "AUTH",
  "GET /deals/:id/quote": "AUTH",
  "POST /deals/:id/reserve": "AUTH",
  "POST /deals/:id/release": "AUTH",
  "POST /deals/:id/contacts": "AUTH",
  "DELETE /deals/:id/contacts/:contactId": "AUTH",

  "GET /deals/:dealId/returns": "AUTH",
  "POST /deals/:dealId/returns": OA,

  "POST /imports/stock-items/preview": OA,
  "POST /imports/stock-items/commit": OA,
  "GET /imports/stock-items/mapping": OA,
  // ДОБАВЬТЕ маршруты импорта и остальные из списка, который выведет тест (их пути у вас в imports.controller.ts)
};

interface RouteInfo {
  key: string; // "POST /deals/:id/reserve"
  method: string;
  path: string;
  hasJwtGuard: boolean;
  hasRolesGuard: boolean;
  roles: Role[];
}

const GUARDS_METADATA = '__guards__';

function joinPath(...parts: string[]) {
  const joined = '/' + parts.map((p) => String(p ?? '')).join('/');
  const clean = joined.replace(/\/+/g, '/').replace(/\/$/, '');
  return clean === '' ? '/' : clean;
}

function guardNames(target: unknown): string[] {
  const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, target as object) ?? [];
  return guards.map((g: any) => (typeof g === 'function' ? g.name : g?.constructor?.name));
}

function collectRoutes(app: INestApplication): RouteInfo[] {
  const container = app.get(ModulesContainer);
  const routes: RouteInfo[] = [];
  for (const mod of container.values()) {
    for (const wrapper of mod.controllers.values()) {
      const ctrl = wrapper.metatype as any;
      if (!ctrl) continue;
      const ctrlPath = Reflect.getMetadata(PATH_METADATA, ctrl) ?? '';
      for (const name of Object.getOwnPropertyNames(ctrl.prototype)) {
        const handler = ctrl.prototype[name];
        const methodId = Reflect.getMetadata(METHOD_METADATA, handler);
        if (methodId === undefined) continue;
        const method = RequestMethod[methodId];
        const path = joinPath(ctrlPath, Reflect.getMetadata(PATH_METADATA, handler) ?? '');
        const guards = [...guardNames(ctrl), ...guardNames(handler)];
        const roles: Role[] =
          Reflect.getMetadata(ROLES_KEY, handler) ?? Reflect.getMetadata(ROLES_KEY, ctrl) ?? [];
        routes.push({
          key: `${method} ${path}`,
          method,
          path,
          hasJwtGuard: guards.includes('JwtAuthGuard'),
          hasRolesGuard: guards.includes('RolesGuard'),
          roles,
        });
      }
    }
  }
  return routes;
}

const FAKE_UUID = '00000000-0000-4000-8000-000000000000';
const concretePath = (p: string) => p.replace(/:[A-Za-z]+/g, FAKE_UUID);
const same = (a: string[], b: string[]) => [...a].sort().join() === [...b].sort().join();

describe('Матрица ролей и маршрутов', () => {
  let app: INestApplication;
  let tenant: TestTenant;
  let routes: RouteInfo[];

  beforeAll(async () => {
    app = await createTestApp();
    routes = collectRoutes(app);
    tenant = await createTenant(app, 'Roles');
  });

  afterAll(async () => {
    await app.close();
  });

  it('нашёл маршруты приложения', () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  it('у каждого маршрута есть решение в таблице DECISIONS', () => {
    const missing = routes.filter((r) => !(r.key in DECISIONS)).map((r) => `  '${r.key}': ???,`);
    if (missing.length) {
      throw new Error(`Маршруты без решения о доступе (добавьте в DECISIONS):\n${missing.join('\n')}`);
    }
  });

  it('в таблице нет маршрутов, которых уже нет в коде', () => {
    const actual = new Set(routes.map((r) => r.key));
    const stale = Object.keys(DECISIONS).filter((k) => !actual.has(k));
    expect(stale).toEqual([]);
  });

  it('защита в коде совпадает с решением в таблице', () => {
    const problems: string[] = [];
    for (const r of routes) {
      const d = DECISIONS[r.key];
      if (d === undefined) continue;
      if (d === 'PUBLIC') {
        if (r.hasJwtGuard) problems.push(`${r.key}: решено PUBLIC, но стоит JwtAuthGuard`);
      } else if (d === 'AUTH') {
        if (!r.hasJwtGuard) problems.push(`${r.key}: нет JwtAuthGuard (маршрут открыт всем)`);
        if (r.roles.length) problems.push(`${r.key}: решено AUTH, но есть @Roles(${r.roles})`);
      } else {
        if (!r.hasJwtGuard) problems.push(`${r.key}: нет JwtAuthGuard`);
        if (!r.hasRolesGuard) problems.push(`${r.key}: есть @Roles, но НЕТ RolesGuard (роли не проверяются)`);
        if (!same(r.roles, d)) problems.push(`${r.key}: в коде роли [${r.roles}], по решению [${d}]`);
      }
    }
    if (problems.length) throw new Error(problems.join('\n'));
  });

  it('без токена защищённые маршруты отвечают 401', async () => {
    const failed: string[] = [];
    for (const r of routes) {
      if (DECISIONS[r.key] === 'PUBLIC') continue;
      const res = await (request(app.getHttpServer()) as any)[r.method.toLowerCase()](concretePath(r.path)).send({});
      if (res.status !== 401) failed.push(`${r.key}: ожидали 401, получили ${res.status}`);
    }
    expect(failed).toEqual([]);
  });

  it('запрещённые роли получают 403', async () => {
    const failed: string[] = [];
    for (const r of routes) {
      const d = DECISIONS[r.key];
      if (!Array.isArray(d)) continue;
      for (const role of ALL_ROLES.filter((x) => !d.includes(x))) {
        const res = await (request(app.getHttpServer()) as any)
          [r.method.toLowerCase()](concretePath(r.path))
          .set('Authorization', `Bearer ${tenant.byRole[role].token}`)
          .send({});
        if (res.status !== 403) failed.push(`${r.key} как ${role}: ожидали 403, получили ${res.status}`);
      }
    }
    expect(failed).toEqual([]);
  });

  it("в таблице решений нет записей без маршрута", () => {
    const existing = new Set(routes.map((r) => r.key));
    const stale = Object.keys(DECISIONS).filter((k) => !existing.has(k));
    expect(stale).toEqual([]);
  });
});
