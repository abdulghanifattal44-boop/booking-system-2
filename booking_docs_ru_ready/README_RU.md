# Booking System (Dockerized) — Customer Portal + Admin Dashboard

Веб‑система бронирования с **двумя полностью разделёнными интерфейсами**:

- **Портал клиента (Customer Portal)**: просмотр организаций/филиалов/ресурсов и доступных слотов **как гость**, создание бронирования **после входа**.
- **Панель администратора (Admin Dashboard)**: управление организациями, филиалами, ресурсами, слотами и бронированиями через отдельную страницу админа.

Проект подготовлен как **полный пакет для защиты**: запуск через Docker, PostgreSQL, две веб‑панели, API и документация.

---

## Быстрый запуск (production-like)

```bash
docker compose up -d --build
```

Остановка:
```bash
docker compose down
```

---

## URLs

- Customer UI: `http://localhost:8081`
- Admin UI: `http://localhost:8082/admin/login`
- API: `http://localhost:4000`

---

## Seed Admin

- Email: `admin@example.com`
- Password: `Admin12345`

---

## Документация

См. папку `docs/`.
