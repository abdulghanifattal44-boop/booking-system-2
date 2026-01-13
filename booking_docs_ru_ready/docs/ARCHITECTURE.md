# Архитектура (RU)

## Компоненты
- Customer UI (React): guest browsing + auth на подтверждении
- Admin UI (React): отдельный вход `/admin/login`, доступ только Admin
- API: Controllers → Services → Data access, JWT + роли
- PostgreSQL: уникальность слотов + 409 при повторной брони

## Ключевые решения
- Разделение Admin и Customer интерфейсов (без ссылок между ними)
- Публичные endpoints для просмотра доступности
- Ограничения БД, чтобы не было двойного бронирования
