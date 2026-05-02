# Demo Seed Data

Файл описывает демо-данные, которые создаются сидом `services/backend/prisma/seed.ts`.

## Тарифы

- `basic` - Basic
- `pro` - Pro
- `enterprise` - Enterprise

## Роли в каждой демо-компании

- `employee` - Сотрудник, приоритет `10`, системная роль
- `support` - Поддержка, приоритет `20`, системная роль
- `moderator` - Модератор, приоритет `30`, системная роль
- `company_admin` - Администратор компании, приоритет `40`, системная роль
- `owner` - Владелец, приоритет `50`, демо-роль

## Распределение сотрудников по ролям

В каждой компании создается 50 активных сотрудников:

- сотрудник 1: `owner`
- сотрудники 2-4: `company_admin`
- сотрудники 5-9: `moderator`
- сотрудники 10-18: `support`
- сотрудники 19-50: `employee`

Первые 5 сотрудников в каждой компании являются общими пользователями:

- `demo.shared.alpha.1@repro.local` - `demo.shared.alpha.5@repro.local` входят в компании 1, 2 и 3
- `demo.shared.beta.1@repro.local` - `demo.shared.beta.5@repro.local` входят в компании 4, 5 и 6

Остальные 45 сотрудников уникальны для своей компании:

- компания 1: `demo.company1.user01@repro.local` - `demo.company1.user45@repro.local`
- компания 2: `demo.company2.user01@repro.local` - `demo.company2.user45@repro.local`
- компания 3: `demo.company3.user01@repro.local` - `demo.company3.user45@repro.local`
- компания 4: `demo.company4.user01@repro.local` - `demo.company4.user45@repro.local`
- компания 5: `demo.company5.user01@repro.local` - `demo.company5.user45@repro.local`
- компания 6: `demo.company6.user01@repro.local` - `demo.company6.user45@repro.local`

## Компании

### 1. ООО "Северный Прокат"

- ИНН: `7701000001`
- Тариф: `enterprise`
- Контакт: Анна Северова
- Email: `admin@north-rent.demo`
- Телефон: `+79990000001`
- Общие сотрудники: `demo.shared.alpha.1@repro.local` - `demo.shared.alpha.5@repro.local`
- Уникальные сотрудники: `demo.company1.user01@repro.local` - `demo.company1.user45@repro.local`

### 2. ООО "Городские Ресурсы"

- ИНН: `7701000002`
- Тариф: `pro`
- Контакт: Иван Городецкий
- Email: `admin@city-resources.demo`
- Телефон: `+79990000002`
- Общие сотрудники: `demo.shared.alpha.1@repro.local` - `demo.shared.alpha.5@repro.local`
- Уникальные сотрудники: `demo.company2.user01@repro.local` - `demo.company2.user45@repro.local`

### 3. АО "Технопарк Восток"

- ИНН: `7701000003`
- Тариф: `enterprise`
- Контакт: Мария Восточная
- Email: `admin@tech-vostok.demo`
- Телефон: `+79990000003`
- Общие сотрудники: `demo.shared.alpha.1@repro.local` - `demo.shared.alpha.5@repro.local`
- Уникальные сотрудники: `demo.company3.user01@repro.local` - `demo.company3.user45@repro.local`

### 4. ООО "Логистика Плюс"

- ИНН: `7701000004`
- Тариф: `pro`
- Контакт: Павел Логинов
- Email: `admin@logistics-plus.demo`
- Телефон: `+79990000004`
- Общие сотрудники: `demo.shared.beta.1@repro.local` - `demo.shared.beta.5@repro.local`
- Уникальные сотрудники: `demo.company4.user01@repro.local` - `demo.company4.user45@repro.local`

### 5. ООО "Креатив Лаб"

- ИНН: `7701000005`
- Тариф: `basic`
- Контакт: Елена Лабина
- Email: `admin@creative-lab.demo`
- Телефон: `+79990000005`
- Общие сотрудники: `demo.shared.beta.1@repro.local` - `demo.shared.beta.5@repro.local`
- Уникальные сотрудники: `demo.company5.user01@repro.local` - `demo.company5.user45@repro.local`

### 6. АО "Инженерный Центр"

- ИНН: `7701000006`
- Тариф: `enterprise`
- Контакт: Дмитрий Инженеров
- Email: `admin@engineering-center.demo`
- Телефон: `+79990000006`
- Общие сотрудники: `demo.shared.beta.1@repro.local` - `demo.shared.beta.5@repro.local`
- Уникальные сотрудники: `demo.company6.user01@repro.local` - `demo.company6.user45@repro.local`

## Элементы / ресурсы в каждой компании

Каждая компания получает одинаковые 20 видов ресурсов:

- `meeting-small` - Переговорная малая, категория `Помещения`
- `meeting-large` - Переговорная большая, категория `Помещения`
- `conference-hall` - Конференц-зал, категория `Помещения`
- `training-room` - Учебный класс, категория `Помещения`
- `projector` - Проектор, категория `Оборудование`
- `screen` - Экран мобильный, категория `Оборудование`
- `laptop` - Ноутбук, категория `Техника`
- `tablet` - Планшет, категория `Техника`
- `microphones` - Комплект микрофонов, категория `Оборудование`
- `camera` - Фотоаппарат, категория `Техника`
- `video-camera` - Видеокамера, категория `Техника`
- `light-kit` - Световой комплект, категория `Оборудование`
- `3d-printer` - 3D-принтер, категория `Лаборатория`
- `soldering-station` - Паяльная станция, категория `Лаборатория`
- `measure-kit` - Измерительный комплект, категория `Лаборатория`
- `car` - Служебный автомобиль, категория `Транспорт`
- `van` - Грузовой фургон, категория `Транспорт`
- `bike` - Велосипед курьерский, категория `Транспорт`
- `demo-stand` - Стенд для презентаций, категория `Мероприятия`
- `badge-kit` - Комплект бейджей, категория `Мероприятия`

## Доступ к ресурсам

Минимальная роль для ресурса задается по индексу ресурса в сид-файле:

- каждый 5-й ресурс требует минимум `moderator`
- каждый 4-й ресурс требует минимум `support`
- остальные ресурсы требуют минимум `employee`

Количество ресурса задается автоматически:

- `quantity_total`: от `1` до `4` по циклу
- `quantity_active`: равно `0` для каждого 7-го ресурса, иначе совпадает с `quantity_total`
