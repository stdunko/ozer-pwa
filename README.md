# Ozer PWA

Веб-копия клиентского приложения Ozer: React + Vite, ставится на телефон как PWA. Бэкенд тот же, что у нативного клиента: `https://ozer-5d2a2a16a914.herokuapp.com/`.

Исходный мобильный проект: [stdunko/ozer](https://github.com/stdunko/ozer).

## Локальный запуск

```bash
npm install
npm run dev
```

Сборка и локальный прод-сервер:

```bash
npm run build
npm start
```

Переменная `API_BASE_URL` (опционально) — адрес API. По умолчанию прокси идёт на существующий Heroku-бэкенд. Браузер ходит на `/api`, сервер проксирует запросы дальше, поэтому CORS с другого origin не нужен.

## Деплой

- GitHub: репозиторий `ozer-pwa`
- Heroku: Node-приложение, `Procfile` → `web: node server.js`, после `npm install` выполняется `vite build`, затем Express раздаёт `dist/` и проксирует `/api`

```bash
heroku create ozer-pwa
heroku buildpacks:set heroku/nodejs
git push heroku main
```

# Что работает

Полный пользовательский сценарий клиента, перенесённый с React Native:

- Онбординг (язык + 3 слайда, один раз)
- Вход по телефону + OTP из SMS (код по-прежнему шлёт бэкенд)
- Категории, поиск, создание заказа
- Карта при создании заказа и просмотр геопозиции заказа (OpenStreetMap / Leaflet)
- Профиль: имя, email, выход
- Список заказов, фильтры, удаление NEW-заказа, опрос статуса раз в 20 секунд
- Чаты Firestore: список, переписка, вложения-картинки, галочки прочтения
- RU / EN / HE / AR, RTL для иврита и арабского
- Установка как PWA (Chrome / Android; Safari «На экран Домой»)
- Сессия в `localStorage`

# Что не работает из-за переезда на веб

Это ограничения платформы, а не «недоделанные экраны»:

| Возможность | Почему |
|---|---|
| Push-уведомления FCM (`@react-native-firebase/messaging`) | Нужен Web Push + VAPID-ключ и домен в Firebase Console. Не перенесено. |
| Google Maps (натив: `expo-maps`) | В PWA стоит OpenStreetMap. Внешний вид и POI другие. |
| Автоподстановка OTP из SMS (Android Autofill) | В браузере работает только если SMS соответствует [Web OTP](https://web.dev/web-otp/) и страница HTTPS. Обычно код нужно ввести руками. |
| Выбор страны в телефоне | На вебе поле с префиксом `+972`. Другую страну можно вписать вручную (`+7…`). |
| Камера / галерея как в native picker | В чате — обычный `<input type="file" accept="image/*">`. Видео в чат по-прежнему не отправляется (как в оригинале). |
| Скрытие таббара клавиатурой | На вебе таббар скрыт на экранах чата и создания заказа. |
| Офлайн-режим API | PWA кэширует оболочку. Заказы, логин и Firestore без сети не работают. |
| iOS: установка только через Safari, нет пушей в PWA до iOS 16.4+, нет фоновой геолокации | Ограничения iOS. |
| Иконки PWA maskable | Сейчас используется тот же `icon.png`, без безопасной зоны под круг Android. |

# Что нужно пофиксить вручную (я не смогу с этой машины)

1. **Firebase Authorized domains**  
   Firebase Console → Authentication → Settings → Authorized domains. Добавить хост Heroku, например `ozer-pwa-….herokuapp.com`. Без этого Firestore с продакшен-домена может быть заблокирован.  
   `localhost` уже обычно разрешён.

2. **Firestore indexes / rules**  
   Те же, что у нативного приложения. Если чаты падают с ошибкой index — открыть ссылку из консоли браузера и создать индекс. Rules менять не нужно, если натив уже работает.

3. **Google Maps вместо OSM (по желанию)**  
   Ключ `AIzaSyAP8NwyF5LcMVefvEFI6Kc9tk08ltSsCMk` в нативе, скорее всего, ограничен Android/iOS. Для JS Maps API: включить Maps JavaScript API, ограничить ключ HTTP-referrer нового домена, заменить `MapView` на `@react-google-maps/api`.

4. **Web Push**  
   Firebase Console → Cloud Messaging → Web Push certificates → сгенерировать VAPID. Добавить `getMessaging` + `firebase-messaging-sw.js`. На бэкенде слать web-токены отдельно от Android/iOS.

5. **GitHub CLI**  
   На этой машине не было `gh`. Если репозиторий не создался автоматически: [github.com/new](https://github.com/new) → имя `ozer-pwa` → `git remote add origin https://github.com/stdunko/ozer-pwa.git && git push -u origin main`.

6. **Heroku billing / имя приложения**  
   Имя `ozer-pwa` может быть занято. Eco/Hobby dyno должен быть включён у аккаунта `webatar.office@gmail.com`. После деплоя: `heroku open`.

7. **SMS / телефон**  
   OTP ходит через существующий бэкенд. Если провайдер режет веб-трафик — это на стороне API, не PWA.

8. **PWA-иконки 192/512**  
   Сейчас лежит исходный `icon.png`. Для стора/установки лучше вырезать квадратные PNG 192 и 512.

# Стек

React 19, Vite 6, React Router 7, Redux Toolkit, i18next, Firebase JS SDK, Leaflet, Express (статика + `/api` proxy), `vite-plugin-pwa`.
