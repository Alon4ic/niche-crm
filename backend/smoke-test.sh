#!/usr/bin/env bash
# Смоук-тест Niche CRM: проверяет через HTTP права доступа, изоляцию компаний,
# правила склада, возвраты, импорт и настройки безопасности.
#
#   bash smoke-test.sh              бэкенд на http://localhost:3000
#   BASE=http://host:3000 bash smoke-test.sh
#   bash smoke-test.sh --throttle   дополнительно проверит лимит попыток входа
#                                   (после него вход с вашего IP заблокирован примерно на минуту)
#
# Нужны curl и jq. Скрипт создаёт в базе тестовые компании "Smoke A/B <время>".
# Лимиты: регистрация 5 в минуту. Один прогон тратит 2, не запускайте чаще двух раз в минуту.

BASE=${BASE:-http://localhost:3000}
PASS=0
FAIL=0
STATUS=""
BODY=""
MAIN_JAR=$(mktemp)
JAR="$MAIN_JAR"
trap 'rm -f "$MAIN_JAR" "$MAIN_JAR.old" "$MAIN_JAR.before"' EXIT

# ---------- вспомогательные функции ----------

ok()  { PASS=$((PASS + 1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL + 1)); echo "  ❌ $1"; if [ -n "${2:-}" ]; then echo "     $2"; fi; }
section() { echo; echo "== $1"; }
die() { echo "⛔ $1"; exit 2; }

# call МЕТОД ПУТЬ [ТОКЕН] [JSON] — результат в STATUS и BODY
call() {
  local method=$1 path=$2 token=${3:-} data=${4:-}
  local args=(-s -X "$method" "$BASE$path" -w $'\n%{http_code}' -b "$JAR" -c "$JAR")
  if [ -n "$token" ]; then args+=(-H "Authorization: Bearer $token"); fi
  if [ -n "$data" ]; then args+=(-H "Content-Type: application/json" -d "$data"); fi
  local out
  out=$(curl "${args[@]}")
  STATUS=${out##*$'\n'}
  BODY=${out%$'\n'*}
}

# jget ФИЛЬТР — значение из BODY
jget() { printf '%s' "$BODY" | jq -r "$1" 2>/dev/null; }

expect() { # ОПИСАНИЕ ОЖИДАЕМЫЙ_СТАТУС
  if [ "$STATUS" = "$2" ]; then ok "$1"; else bad "$1" "ожидали HTTP $2, получили $STATUS. Ответ: ${BODY:0:300}"; fi
}
expect_any() { # ОПИСАНИЕ "СТАТУС1 СТАТУС2"
  case " $2 " in
    *" $STATUS "*) ok "$1" ;;
    *) bad "$1" "ожидали HTTP из [$2], получили $STATUS. Ответ: ${BODY:0:300}" ;;
  esac
}
expect_eq() { # ОПИСАНИЕ ОЖИДАЕМОЕ ФАКТИЧЕСКОЕ
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "ожидали '$2', получили '$3'"; fi
}

login_token() { # EMAIL
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"password123\"}" | jq -r '.accessToken // empty'
}

# upload_status ПУТЬ ТОКЕН ФАЙЛ [MAPPING] — печатает статус, тело в BODY через /tmp/smoke_body
upload_status() {
  local path=$1 token=$2 file=$3 mapping=${4:-}
  local args=(-s -o /tmp/smoke_body -w '%{http_code}' -X POST "$BASE$path" -H "Authorization: Bearer $token" -F "file=@$file")
  if [ -n "$mapping" ]; then args+=(-F "mapping=$mapping"); fi
  curl "${args[@]}"
}
do_upload() { STATUS=$(upload_status "$@"); BODY=$(cat /tmp/smoke_body); }

# race МЕТОД ТОКЕН JSON ПУТЬ1 ПУТЬ2 — два одновременных запроса, печатает отсортированные статусы
race() {
  local method=$1 token=$2 data=$3 path1=$4 path2=$5 i path
  rm -f /tmp/smoke_race_1 /tmp/smoke_race_2
  for i in 1 2; do
    if [ "$i" = "1" ]; then path=$path1; else path=$path2; fi
    (
      if [ -n "$data" ]; then
        curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" \
          -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$data" > "/tmp/smoke_race_$i"
      else
        curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE$path" \
          -H "Authorization: Bearer $token" > "/tmp/smoke_race_$i"
      fi
    ) &
  done
  wait
  printf '%s\n%s\n' "$(cat /tmp/smoke_race_1)" "$(cat /tmp/smoke_race_2)" | sort | tr '\n' ' ' | sed 's/ $//'
}

# ---------- помощники сущностей (печатают id) ----------

new_stock() { # SKU НАЗВАНИЕ ЦЕНА ОСТАТОК
  call POST /stock-items "$OWNER_TOKEN" "{\"sku\":\"$1\",\"name\":\"$2\",\"unit\":\"pcs\",\"unitCost\":$3,\"quantityOnHand\":$4}"
  jget .id
}
new_deal() { # НАЗВАНИЕ
  call POST /deals "$OWNER_TOKEN" "{\"title\":\"$1\",\"clientId\":\"$CLIENT_ID\",\"value\":1000}"
  jget .id
}
add_bom() { # СДЕЛКА ПОЗИЦИЯ КОЛИЧЕСТВО
  call POST "/deals/$1/bom-items" "$OWNER_TOKEN" "{\"stockItemId\":\"$2\",\"quantity\":$3}"
  jget .id
}
stock_num() { # ПОЗИЦИЯ ПОЛЕ — число из карточки склада
  call GET "/stock-items/$1" "$OWNER_TOKEN"
  jget ".$2 | tonumber"
}
set_stage() { call PATCH "/deals/$1/stage" "$OWNER_TOKEN" "{\"stage\":\"$2\"}"; }
return_body() { # ПОЗИЦИЯ КОЛИЧЕСТВО ИСХОД
  printf '{"reason":"smoke","items":[{"stockItemId":"%s","quantity":%s,"disposition":"%s"}]}' "$1" "$2" "$3"
}

# ---------- основной сценарий ----------

main() {
  command -v jq >/dev/null || die "Нужен jq (brew install jq)"
  local RUN OWNER_EMAIL ADMIN_EMAIL MEMBER_EMAIL
  RUN=$(date +%s)
  echo "Niche CRM smoke test | $BASE | прогон $RUN"

  call GET /settings ""
  if [ "$STATUS" = "000" ]; then die "Backend не отвечает на $BASE. Проверьте docker compose ps и npm run start:dev"; fi
  expect "Запрос без токена отклоняется" 401

  section "1. Регистрация, профиль, нормализация данных"
  OWNER_EMAIL="smoke.$RUN.owner@example.com"
  call POST /auth/register "" "{\"email\":\"  Smoke.$RUN.Owner@Example.COM \",\"password\":\"password123\",\"tenantName\":\"Smoke A $RUN\",\"firstName\":\"  Anna  \",\"lastName\":\"   \"}"
  expect "Регистрация компании A" 201
  OWNER_TOKEN=$(jget '.accessToken // empty')
  expect_eq "Refresh-токена нет в теле ответа" "" "$(jget '.refreshToken // empty')"
  if [ -z "$OWNER_TOKEN" ]; then die "Нет токена после регистрации (лимит регистраций или ошибка backend): ${BODY:0:300}"; fi
  call GET /auth/me "$OWNER_TOKEN"
  expect "/auth/me отдаёт профиль" 200
  expect_eq "Email приведён к нижнему регистру" "$OWNER_EMAIL" "$(jget .email)"
  expect_eq "Имя очищено от пробелов" "Anna" "$(jget .firstName)"
  expect_eq "Пустая фамилия сохранена как null" "null" "$(jget .lastName)"
  expect_eq "В профиле есть название компании" "Smoke A $RUN" "$(jget .tenant.name)"
  expect_eq "Роль создателя компании OWNER" "OWNER" "$(jget .role)"

  section "2. Обновление и выход"
  cp "$MAIN_JAR" "$MAIN_JAR.old"                 # cookie до ротации

  call POST /auth/refresh ""
  expect_any "Refresh по cookie выдаёт новый access-токен" "200 201"
  expect_eq "В ответе есть access-токен" "yes" "$([ -n "$(jget '.accessToken // empty')" ] && echo yes || echo no)"
  expect_eq "Refresh-токена нет в теле ответа refresh" "" "$(jget '.refreshToken // empty')"

  JAR="$MAIN_JAR.old"                            # подставляем cookie до ротации
  call POST /auth/refresh ""
  expect "Старый refresh после ротации не работает" 401
  JAR="$MAIN_JAR"

  cp "$MAIN_JAR" "$MAIN_JAR.before"              # cookie до logout
  call POST /auth/logout ""
  expect_any "Logout" "200 201 204"

  JAR="$MAIN_JAR.before"                         # токен, который logout должен был отозвать
  call POST /auth/refresh ""
  expect "Refresh отозванным токеном не работает" 401
  JAR="$MAIN_JAR"

  call POST /auth/refresh ""
  expect "Refresh без cookie не работает" 401

  section "3. Сотрудники и роли"
  ADMIN_EMAIL="smoke.$RUN.admin@example.com"
  MEMBER_EMAIL="smoke.$RUN.member@example.com"
  call POST /users "$OWNER_TOKEN" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"password123\",\"role\":\"ADMIN\",\"firstName\":\"Adam\"}"
  expect "OWNER создаёт ADMIN" 201
  call POST /users "$OWNER_TOKEN" "{\"email\":\"$MEMBER_EMAIL\",\"password\":\"password123\",\"role\":\"MEMBER\"}"
  expect "OWNER создаёт MEMBER" 201
  call POST /users "$OWNER_TOKEN" "{\"email\":\"smoke.$RUN.second@example.com\",\"password\":\"password123\",\"role\":\"OWNER\"}"
  expect "Второго OWNER создать нельзя" 400
  call POST /users "$OWNER_TOKEN" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"password123\",\"role\":\"MEMBER\"}"
  expect "Повторный email отклоняется" 409
  call POST /auth/login "" "{\"email\":\"SMOKE.$RUN.ADMIN@EXAMPLE.COM\",\"password\":\"password123\"}"
  expect "Вход не зависит от регистра email" 201
  ADMIN_TOKEN=$(jget '.accessToken // empty')
  MEMBER_TOKEN=$(login_token "$MEMBER_EMAIL")
  if [ -z "$ADMIN_TOKEN" ] || [ -z "$MEMBER_TOKEN" ]; then die "Не удалось войти под ADMIN или MEMBER"; fi

  call POST /users "$ADMIN_TOKEN" "{\"email\":\"smoke.$RUN.x1@example.com\",\"password\":\"password123\",\"role\":\"MEMBER\"}"
  expect "ADMIN не может создавать сотрудников" 403
  call POST /users "$MEMBER_TOKEN" "{\"email\":\"smoke.$RUN.x2@example.com\",\"password\":\"password123\",\"role\":\"MEMBER\"}"
  expect "MEMBER не может создавать сотрудников" 403
  call GET /users "$ADMIN_TOKEN"
  expect "ADMIN видит список сотрудников" 200
  call GET /users "$MEMBER_TOKEN"
  expect "MEMBER не видит список сотрудников" 403
  call PATCH /settings "$ADMIN_TOKEN" '{"returnWindowDays":30}'
  expect "ADMIN не меняет настройки" 403
  call PATCH /settings "$MEMBER_TOKEN" '{"returnWindowDays":30}'
  expect "MEMBER не меняет настройки" 403
  call GET /settings "$MEMBER_TOKEN"
  expect "MEMBER читает настройки" 200
  expect_eq "Срок возврата по умолчанию 14 дней" "14" "$(jget .returnWindowDays)"

  section "4. Права на данные"
  call POST /clients "$MEMBER_TOKEN" '{"name":"Member client"}'
  expect "MEMBER не создаёт клиентов" 403
  call POST /clients "$OWNER_TOKEN" '{"name":"Smoke Client"}'
  expect "OWNER создаёт клиента" 201
  CLIENT_ID=$(jget .id)
  call POST /clients "$ADMIN_TOKEN" '{"name":"Admin client"}'
  expect "ADMIN создаёт клиента" 201
  ADMIN_CLIENT_ID=$(jget .id)
  call GET /clients "$MEMBER_TOKEN"
  expect "MEMBER читает клиентов" 200
  call DELETE "/clients/$ADMIN_CLIENT_ID" "$MEMBER_TOKEN"
  expect "MEMBER не удаляет клиентов" 403
  call POST /contacts "$OWNER_TOKEN" "{\"fullName\":\"Smoke Contact\",\"clientId\":\"$CLIENT_ID\"}"
  expect "OWNER создаёт контакт" 201
  CONTACT_ID=$(jget .id)
  call POST /contacts "$MEMBER_TOKEN" "{\"fullName\":\"X\",\"clientId\":\"$CLIENT_ID\"}"
  expect "MEMBER не создаёт контакты" 403
  call POST /stock-items "$MEMBER_TOKEN" '{"sku":"MEM-1","name":"X","unit":"pcs","unitCost":1}'
  expect "MEMBER не создаёт складские позиции" 403
  # изменение и удаление проверяем на одноразовых записях: если защиты нет,
  # она не сломает остальные проверки
  call PATCH "/clients/$CLIENT_ID" "$MEMBER_TOKEN" '{"name":"Hacked"}'
  expect "MEMBER не меняет клиентов" 403
  call POST /contacts "$OWNER_TOKEN" "{\"fullName\":\"Temp contact\",\"clientId\":\"$CLIENT_ID\"}"
  TMP_CONTACT=$(jget .id)
  call PATCH "/contacts/$TMP_CONTACT" "$MEMBER_TOKEN" '{"fullName":"Hacked"}'
  expect "MEMBER не меняет контакты" 403
  call DELETE "/contacts/$TMP_CONTACT" "$MEMBER_TOKEN"
  expect "MEMBER не удаляет контакты" 403
  TMP_STOCK=$(new_stock "SM-TMP" "Temp item" 1 1)
  call PATCH "/stock-items/$TMP_STOCK" "$MEMBER_TOKEN" '{"name":"Hacked"}'
  expect "MEMBER не меняет складские позиции" 403
  call DELETE "/stock-items/$TMP_STOCK" "$MEMBER_TOKEN"
  expect "MEMBER не удаляет складские позиции" 403
  call POST /deals "$MEMBER_TOKEN" "{\"title\":\"Member deal\",\"clientId\":\"$CLIENT_ID\",\"value\":10}"
  expect "MEMBER создаёт сделки" 201
  call PATCH "/contacts/$CONTACT_ID" "$OWNER_TOKEN" "{\"clientId\":\"$ADMIN_CLIENT_ID\"}"
  expect "Контакт нельзя перепривязать к другому клиенту" 400

  section "5. Изоляция между компаниями"
  call POST /auth/register "" "{\"email\":\"smoke.$RUN.b@example.com\",\"password\":\"password123\",\"tenantName\":\"Smoke B $RUN\"}"
  expect "Регистрация компании B" 201
  B_TOKEN=$(jget '.accessToken // empty')
  if [ -z "$B_TOKEN" ]; then die "Нет токена компании B"; fi
  S1=$(new_stock "SM-1" "Smoke item 1" 10 100)
  D1=$(new_deal "Smoke deal 1")
  call GET "/clients/$CLIENT_ID" "$B_TOKEN"
  expect "Чужой клиент: 404" 404
  call GET "/stock-items/$S1" "$B_TOKEN"
  expect "Чужая складская позиция: 404" 404
  call GET "/deals/$D1" "$B_TOKEN"
  expect "Чужая сделка: 404" 404
  call GET "/deals/$D1/returns" "$B_TOKEN"
  expect "Возвраты чужой сделки: 404" 404
  call POST "/deals/$D1/bom-items" "$B_TOKEN" "{\"stockItemId\":\"$S1\",\"quantity\":1}"
  expect "Спецификация чужой сделки: 404" 404
  call POST /deals "$B_TOKEN" "{\"title\":\"Steal\",\"clientId\":\"$CLIENT_ID\",\"value\":1}"
  expect "Сделка с чужим клиентом: 404" 404
  call GET /clients "$B_TOKEN"
  expect_eq "Список клиентов компании B пуст" "0" "$(jget 'length')"

  section "6. Спецификация, себестоимость, резерв"
  BOM1=$(add_bom "$D1" "$S1" 10)
  call GET "/deals/$D1/cost" "$OWNER_TOKEN"
  expect_eq "Себестоимость 10 × 10" "100" "$(jget .totalCost)"
  call PATCH "/stock-items/$S1" "$OWNER_TOKEN" '{"unitCost":20}'
  expect "Цену на складе можно изменить" 200
  call GET "/deals/$D1/cost" "$OWNER_TOKEN"
  expect_eq "Себестоимость не изменилась (снимок цены)" "100" "$(jget .totalCost)"
  call POST "/deals/$D1/reserve" "$OWNER_TOKEN"
  expect "Резервирование" 201
  expect_eq "На складе зарезервировано 10" "10" "$(stock_num "$S1" quantityReserved)"
  call POST "/deals/$D1/reserve" "$OWNER_TOKEN"
  expect "Повторный резерв: 409" 409
  call POST "/deals/$D1/bom-items" "$OWNER_TOKEN" "{\"stockItemId\":\"$S1\",\"quantity\":1}"
  expect "Нельзя добавить позицию при резерве" 409
  call DELETE "/deals/$D1/bom-items/$BOM1" "$OWNER_TOKEN"
  expect "Нельзя удалить позицию при резерве" 409
  call PATCH "/stock-items/$S1" "$OWNER_TOKEN" '{"quantityOnHand":5}'
  expect "Остаток ниже резерва запрещён" 409
  call POST "/deals/$D1/release" "$OWNER_TOKEN"
  expect_any "Снятие резерва" "200 201"
  expect_eq "Резерв снят" "0" "$(stock_num "$S1" quantityReserved)"
  call POST "/deals/$D1/release" "$OWNER_TOKEN"
  expect "Повторное снятие: 400" 400

  section "7. Стадии: выигрыш, проигрыш, списание"
  call POST "/deals/$D1/reserve" "$OWNER_TOKEN"
  expect "Резерв перед выигрышем" 201
  set_stage "$D1" WON
  expect "Выигрыш сделки" 200
  expect_eq "Склад списан: остаток 90" "90" "$(stock_num "$S1" quantityOnHand)"
  expect_eq "Склад списан: резерв 0" "0" "$(stock_num "$S1" quantityReserved)"
  set_stage "$D1" NEGOTIATION
  expect "Выигранную со списанием нельзя вернуть в работу" 409
  call POST "/deals/$D1/reserve" "$OWNER_TOKEN"
  expect "Нельзя резервировать закрытую сделку" 409
  call POST "/deals/$D1/bom-items" "$OWNER_TOKEN" "{\"stockItemId\":\"$S1\",\"quantity\":1}"
  expect "Спецификация выигранной сделки заморожена" 409

  D2=$(new_deal "Smoke deal 2")
  add_bom "$D2" "$S1" 1 >/dev/null
  set_stage "$D2" WON
  expect "Выигрыш без резерва отклоняется" 409
  call POST "/deals/$D2/reserve" "$OWNER_TOKEN"
  expect "Резерв для сделки 2" 201
  expect_eq "Зарезервировано 1" "1" "$(stock_num "$S1" quantityReserved)"
  set_stage "$D2" LOST
  expect "Сделка проиграна" 200
  expect_eq "Проигрыш снял резерв" "0" "$(stock_num "$S1" quantityReserved)"

  D3=$(new_deal "Smoke deal 3 (без спецификации)")
  set_stage "$D3" WON
  expect "Выигрыш без спецификации" 200
  set_stage "$D3" NEGOTIATION
  expect "Выигрыш без списания можно вернуть в работу" 200

  S2=$(new_stock "SM-2" "Smoke item 2" 5 5)
  D4=$(new_deal "Smoke deal 4")
  add_bom "$D4" "$S2" 50 >/dev/null
  call POST "/deals/$D4/reserve" "$OWNER_TOKEN"
  expect_any "Нехватка остатков отклоняется" "400 409"
  expect_eq "При нехватке ничего не зарезервировано" "0" "$(stock_num "$S2" quantityReserved)"

  section "8. Конкурентные запросы"
  D5=$(new_deal "Smoke deal 5")
  add_bom "$D5" "$S1" 1 >/dev/null
  RES=$(race POST "$OWNER_TOKEN" "" "/deals/$D5/reserve" "/deals/$D5/reserve")
  expect_eq "Два одновременных резерва одной сделки: один успех, один отказ" "201 409" "$RES"
  call POST "/deals/$D5/release" "$OWNER_TOKEN"
  S3=$(new_stock "SM-3" "Smoke item 3" 5 10)
  D6=$(new_deal "Smoke deal 6"); add_bom "$D6" "$S3" 6 >/dev/null
  D7=$(new_deal "Smoke deal 7"); add_bom "$D7" "$S3" 6 >/dev/null
  RES=$(race POST "$OWNER_TOKEN" "" "/deals/$D6/reserve" "/deals/$D7/reserve")
  case "$RES" in
    "201 400"|"201 409") ok "Последние единицы получает только одна сделка ($RES)" ;;
    *) bad "Последние единицы получает только одна сделка" "получили '$RES'" ;;
  esac
  expect_eq "Зарезервировано 6 из 10, а не 12" "6" "$(stock_num "$S3" quantityReserved)"

  section "9. Возвраты (сделка 1: отгружено 10, на складе 90)"
  call GET "/deals/$D1/returns" "$OWNER_TOKEN"
  expect "Информация о возвратах" 200
  expect_eq "Возврат доступен" "true" "$(jget .eligible)"
  expect_eq "Можно вернуть 10" "10" "$(jget '.lines[0].returnable | tonumber')"
  call POST "/deals/$D1/returns" "$MEMBER_TOKEN" "$(return_body "$S1" 1 RESTOCK)"
  expect "MEMBER не оформляет возвраты" 403
  call POST "/deals/$D1/returns" "$ADMIN_TOKEN" "$(return_body "$S1" 3 RESTOCK)"
  expect "Возврат 3 шт. на склад" 201
  expect_eq "Склад 93" "93" "$(stock_num "$S1" quantityOnHand)"
  call POST "/deals/$D1/returns" "$OWNER_TOKEN" "$(return_body "$S1" 2 WRITE_OFF)"
  expect "Возврат 2 шт. как брак" 201
  expect_eq "Брак не меняет склад: 93" "93" "$(stock_num "$S1" quantityOnHand)"
  call POST "/deals/$D1/returns" "$OWNER_TOKEN" "$(return_body "$S1" 6 RESTOCK)"
  expect "Больше возможного (6 при остатке 5): 409" 409
  call POST "/deals/$D1/returns" "$OWNER_TOKEN" "$(return_body "$S2" 1 RESTOCK)"
  expect "Позиция вне отгрузки: 400" 400
  call POST "/deals/$D2/returns" "$OWNER_TOKEN" "$(return_body "$S1" 1 RESTOCK)"
  expect "Возврат по проигранной сделке: 409" 409
  call PATCH /settings "$OWNER_TOKEN" '{"returnWindowDays":0}'
  expect "OWNER отключает возвраты (срок 0)" 200
  call POST "/deals/$D1/returns" "$OWNER_TOKEN" "$(return_body "$S1" 1 RESTOCK)"
  expect "При сроке 0 возврат отклоняется" 409
  call PATCH /settings "$OWNER_TOKEN" '{"returnWindowDays":14}'
  expect "Срок возврата восстановлен" 200
  RES=$(race POST "$OWNER_TOKEN" "$(return_body "$S1" 5 RESTOCK)" "/deals/$D1/returns" "/deals/$D1/returns")
  expect_eq "Два одновременных возврата остатка: один успех, один отказ" "201 409" "$RES"
  expect_eq "Склад 98 (90 + 3 + 5)" "98" "$(stock_num "$S1" quantityOnHand)"

  section "10. Целостность и связи"
  call POST /stock-items "$OWNER_TOKEN" '{"sku":"SM-1","name":"Duplicate","unit":"pcs","unitCost":1}'
  expect "Дубликат SKU: 409" 409
  call DELETE "/clients/$CLIENT_ID" "$OWNER_TOKEN"
  expect "Клиента со сделками удалить нельзя" 409
  call DELETE "/stock-items/$S1" "$OWNER_TOKEN"
  expect "Используемую позицию склада удалить нельзя" 409
  call DELETE "/clients/$ADMIN_CLIENT_ID" "$OWNER_TOKEN"
  expect "Клиента без сделок удалить можно" 204
  call POST "/deals/$D1/contacts" "$OWNER_TOKEN" "{\"contactId\":\"$CONTACT_ID\"}"
  expect "Контакт привязан к сделке" 201
  call POST "/deals/$D1/contacts" "$OWNER_TOKEN" "{\"contactId\":\"$CONTACT_ID\"}"
  expect "Повторная привязка: 409" 409
  call POST /clients "$OWNER_TOKEN" '{"name":"Other client"}'
  OTHER_CLIENT=$(jget .id)
  call POST /contacts "$OWNER_TOKEN" "{\"fullName\":\"Other contact\",\"clientId\":\"$OTHER_CLIENT\"}"
  OTHER_CONTACT=$(jget .id)
  call POST "/deals/$D1/contacts" "$OWNER_TOKEN" "{\"contactId\":\"$OTHER_CONTACT\"}"
  expect "Контакт чужого клиента к сделке не привязать" 400

  section "11. Аналитика и PDF"
  call GET /deals/analytics/funnel "$OWNER_TOKEN"
  expect "Аналитика воронки" 200
  expect_eq "В аналитике шесть стадий" "6" "$(jget '.stages | length')"
  STATUS=$(curl -s -o /tmp/smoke_quote.pdf -w '%{http_code}' "$BASE/deals/$D1/quote" -H "Authorization: Bearer $OWNER_TOKEN")
  BODY=""
  expect "PDF коммерческого предложения" 200
  expect_eq "Файл начинается с %PDF" "%PDF" "$(head -c 4 /tmp/smoke_quote.pdf)"

  section "12. Импорт из файла"
  printf 'SKU;Name;Unit;Cost;Qty\nIM-1;Import one;pcs;1250,50;5 000\nIM-2;Import two;pcs;$9.90;10\n' > /tmp/smoke_import.csv
  MAPPING='{"sku":"SKU","name":"Name","unit":"Unit","unitCost":"Cost","quantityOnHand":"Qty"}'
  do_upload /imports/stock-items/preview "$MEMBER_TOKEN" /tmp/smoke_import.csv
  expect "MEMBER не импортирует" 403
  do_upload /imports/stock-items/preview "$OWNER_TOKEN" /tmp/smoke_import.csv
  expect_any "Предпросмотр файла" "200 201"
  expect_eq "В предпросмотре 5 колонок (разделитель ; распознан)" "5" "$(jget '.headers | length')"
  do_upload /imports/stock-items/commit "$OWNER_TOKEN" /tmp/smoke_import.csv "$MAPPING"
  expect_any "Импорт выполнен" "200 201"
  expect_eq "Загружена 1 строка" "1" "$(jget .successCount)"
  expect_eq "Одна строка с ошибкой (валюта в цене)" "1" "$(jget .failedCount)"
  call GET /stock-items "$OWNER_TOKEN"
  expect_eq "Цена 1250,50 разобрана верно" "1250.5" "$(jget '[.[] | select(.sku == "IM-1")][0].unitCost | tonumber')"
  expect_eq "Остаток '5 000' разобран верно" "5000" "$(jget '[.[] | select(.sku == "IM-1")][0].quantityOnHand | tonumber')"
  do_upload /imports/stock-items/commit "$OWNER_TOKEN" /tmp/smoke_import.csv "$MAPPING"
  call GET /stock-items "$OWNER_TOKEN"
  expect_eq "Повторный импорт не создаёт дубликат" "1" "$(jget '[.[] | select(.sku == "IM-1")] | length')"
  call GET "/imports/stock-items/mapping?sourceType=CSV" "$OWNER_TOKEN"
  expect "Сопоставление колонок сохранено" 200
  expect_eq "В сохранённом сопоставлении колонка SKU" "SKU" "$(jget .mapping.sku)"
  head -c 6000000 /dev/zero > /tmp/smoke_big.csv
  do_upload /imports/stock-items/preview "$OWNER_TOKEN" /tmp/smoke_big.csv
  expect "Файл больше 5 МБ отклоняется" 413

  section "13. Заголовки безопасности"
  if curl -s -D - -o /dev/null "$BASE/settings" | grep -qi '^x-content-type-options: *nosniff'; then
    ok "Заголовок X-Content-Type-Options (helmet)"
  else
    bad "Заголовок X-Content-Type-Options (helmet)" "заголовка нет: helmet не подключён или процесс не перезапущен"
  fi
  if curl -s -D - -o /dev/null -H "Origin: https://evil.example" "$BASE/settings" | grep -qi '^access-control-allow-origin'; then
    bad "CORS не разрешает чужой источник" "сервер ответил разрешением для https://evil.example"
  else
    ok "CORS не разрешает чужой источник"
  fi

  if [ "${1:-}" = "--throttle" ]; then
    section "14. Лимит попыток входа"
    local codes="" c i
    for i in $(seq 1 12); do
      c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" \
        -H "Content-Type: application/json" -d '{"email":"nobody@example.com","password":"wrongpass1"}')
      codes="$codes $c"
    done
    if printf '%s' "$codes" | grep -q 429; then ok "Лимит сработал:$codes"; else bad "Лимит попыток входа" "ни одного 429:$codes"; fi
  else
    echo
    echo "(лимит попыток входа не проверялся, добавьте флаг --throttle)"
  fi

  echo
  echo "=============================="
  echo "Тестовые аккаунты для ручных проверок в браузере (пароль у всех: password123):"
  echo "  OWNER:  $OWNER_EMAIL"
  echo "  ADMIN:  $ADMIN_EMAIL"
  echo "  MEMBER: $MEMBER_EMAIL"
  echo "Прошло: $PASS, не прошло: $FAIL"
  if [ "$FAIL" -gt 0 ]; then exit 1; fi
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then main "$@"; fi