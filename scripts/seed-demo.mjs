#!/usr/bin/env node
// Заполняет CRM демо-данными через HTTP API (а не прямыми записями в БД),
// поэтому резервы, остатки и себестоимость согласованы по настоящим бизнес-правилам.
//
//   node scripts/seed-demo.mjs
//   API_URL=https://api.example.com INVITE_CODE=secret node scripts/seed-demo.mjs
//
// Переменные окружения:
//   API_URL        адрес бэкенда (по умолчанию http://localhost:3000)
//   INVITE_CODE    пригласительный код, если на бэкенде задан REGISTRATION_INVITE_CODE
//   DEMO_PASSWORD  пароль демо-аккаунтов (по умолчанию demo-password-123)
//
// Скрипт создаёт ОДНУ компанию. Лимит регистрации 5 в минуту, этого хватает.
// Повторный запуск на той же базе остановится: компания уже существует.

const API = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const INVITE = process.env.INVITE_CODE || undefined;
const PASSWORD = process.env.DEMO_PASSWORD ?? "demo-password-123";
const DOMAIN = "oakline.example";

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

const ok = (msg) => console.log(`  ✓ ${msg}`);

async function main() {
  console.log(`Seeding demo data into ${API}\n`);

  // ---------- компания и сотрудники ----------
  let owner;
  try {
    owner = await api("POST", "/auth/register", null, {
      email: `owner@${DOMAIN}`,
      password: PASSWORD,
      tenantName: "Oakline Furniture Workshop",
      firstName: "Olena",
      lastName: "Demo",
      inviteCode: INVITE,
    });
  } catch (e) {
    if (String(e.message).includes("→ 409")) {
      console.error(
        `Демо-компания уже существует (owner@${DOMAIN} зарегистрирован).\n` +
          "Удалите её или используйте чистую базу.",
      );
      process.exit(1);
    }
    if (String(e.message).includes("→ 403")) {
      console.error("Неверный или отсутствующий пригласительный код: задайте INVITE_CODE.");
      process.exit(1);
    }
    throw e;
  }
  const t = owner.accessToken;
  ok("Компания Oakline Furniture Workshop и OWNER");

  await api("POST", "/users", t, {
    email: `admin@${DOMAIN}`, password: PASSWORD, role: "ADMIN", firstName: "Adam",
  });
  await api("POST", "/users", t, {
    email: `member@${DOMAIN}`, password: PASSWORD, role: "MEMBER", firstName: "Maria",
  });
  ok("ADMIN и MEMBER");

  // ---------- клиенты и контакты ----------
  const clientDefs = [
    ["Casa Verde Hotels", ["Elena Rossi", "Marco Bianchi"]],
    ["Nordic Home Interiors", ["Lars Nilsson"]],
    ["Brightside Offices", ["Sophie Martin"]],
    ["Atelier Lumière", ["Claire Dubois"]],
  ];
  const clients = {};
  const contacts = {};
  for (const [name, people] of clientDefs) {
    const c = await api("POST", "/clients", t, { name });
    clients[name] = c.id;
    contacts[name] = [];
    for (const fullName of people) {
      const p = await api("POST", "/contacts", t, { fullName, clientId: c.id });
      contacts[name].push(p.id);
    }
  }
  ok(`${clientDefs.length} клиента с контактами`);

  // ---------- склад ----------
  const stockDefs = {
    oak: ["OAK-25", "Oak board 25 mm", "m2", 42, 120],
    ply: ["PLY-18", "Birch plywood 18 mm", "sheet", 28, 60],
    legs: ["LEG-STL", "Steel legs set", "set", 18.5, 80],
    screws: ["SCR-PK", "Screws pack", "pack", 3.2, 300],
    oil: ["OIL-1L", "Wood oil 1 L", "l", 14, 40],
    slides: ["SLD-PR", "Drawer slides pair", "pair", 6.4, 50],
    handles: ["HND-BR", "Brass handles", "pcs", 2.1, 20],
  };
  const stock = {};
  for (const [key, [sku, name, unit, unitCost, quantityOnHand]] of Object.entries(stockDefs)) {
    const s = await api("POST", "/stock-items", t, { sku, name, unit, unitCost, quantityOnHand });
    stock[key] = s.id;
  }
  ok(`${Object.keys(stockDefs).length} складских позиций`);

  // ---------- сделки ----------
  async function deal(title, clientName, value, bom = []) {
    const d = await api("POST", "/deals", t, { title, clientId: clients[clientName], value });
    for (const [key, quantity] of bom) {
      await api("POST", `/deals/${d.id}/bom-items`, t, { stockItemId: stock[key], quantity });
    }
    return d.id;
  }
  const reserve = (id) => api("POST", `/deals/${id}/reserve`, t);
  const stage = (id, s) => api("PATCH", `/deals/${id}/stage`, t, { stage: s });

  // 1. Отгруженная сделка с возвратом (склад списан, часть вернулась)
  const d1 = await deal("Dining tables x20", "Casa Verde Hotels", 18000, [
    ["oak", 40], ["legs", 20], ["oil", 6], ["screws", 20],
  ]);
  await api("POST", `/deals/${d1}/contacts`, t, { contactId: contacts["Casa Verde Hotels"][0] });
  await reserve(d1);
  await stage(d1, "WON");
  await api("POST", `/deals/${d1}/returns`, t, {
    reason: "Two leg sets damaged in transit",
    items: [
      { stockItemId: stock.legs, quantity: 2, disposition: "RESTOCK" },
      { stockItemId: stock.oil, quantity: 1, disposition: "WRITE_OFF" },
    ],
  });
  ok("Сделка 1: выиграна, склад списан, оформлен возврат");

  // 2. В переговорах, резерв есть, фурнитуры почти не осталось
  const d2 = await deal("Wardrobes x8", "Nordic Home Interiors", 9600, [
    ["ply", 24], ["slides", 16], ["handles", 16], ["screws", 8],
  ]);
  await api("POST", `/deals/${d2}/contacts`, t, { contactId: contacts["Nordic Home Interiors"][0] });
  await reserve(d2);
  await stage(d2, "NEGOTIATION");
  ok("Сделка 2: переговоры, товар зарезервирован (ручек осталось мало)");

  // 3. Есть спецификация, резерва нет
  await deal("Office desks x15", "Brightside Offices", 7500, [
    ["ply", 15], ["legs", 15], ["screws", 15],
  ]);
  ok("Сделка 3: спецификация без резерва");

  // 4. Без спецификации
  const d4 = await deal("Lobby shelving", "Atelier Lumière", 4200);
  await stage(d4, "NEGOTIATION");
  ok("Сделка 4: без спецификации");

  // 5. Проигранная: резерв снят
  const d5 = await deal("Conference table", "Casa Verde Hotels", 3100, [
    ["oak", 12], ["legs", 2],
  ]);
  await reserve(d5);
  await stage(d5, "LOST");
  ok("Сделка 5: проиграна, резерв снят");

  // ---------- проверка складских чисел ----------
  const items = await api("GET", "/stock-items", t);
  console.log("\nСклад (на складе / в резерве / доступно):");
  for (const i of items.sort((a, b) => a.sku.localeCompare(b.sku))) {
    console.log(
      `  ${i.sku.padEnd(8)} ${String(Number(i.quantityOnHand)).padStart(5)} ` +
        `${String(Number(i.quantityReserved)).padStart(5)} ${String(Number(i.quantityAvailable)).padStart(5)}  ${i.name}`,
    );
  }

  console.log("\n==============================");
  console.log(`Демо-аккаунты (пароль у всех: ${PASSWORD}):`);
  console.log(`  OWNER:  owner@${DOMAIN}`);
  console.log(`  ADMIN:  admin@${DOMAIN}`);
  console.log(`  MEMBER: member@${DOMAIN}`);
}

main().catch((e) => {
  console.error(`\n⛔ ${e.message}`);
  process.exit(1);
});

