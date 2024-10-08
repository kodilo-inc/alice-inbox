# alice-inbox
<a href="https://dialogs.yandex.ru/store/skills/2d8532fa-dobavit-v-noush?utm_source=site&utm_medium=badge&utm_campaign=v1&utm_term=d1" target="_blank"><img alt="Алиса это умеет" src="https://dialogs.s3.yandex.net/badges/v1-term1.svg"/></a>

Навык для Алисы "Добавить в мой список", которым можно наполнять списки в Weeek.

## Как тестировать
1. Создайте функцию в [Яндекс Облаке](https://cloud.yandex.ru/) с кодом из этого репозитория. Можно скопировать все файлы, кроме README.MD и LICENSE.
   Сейчас среда выполнения навыка — NodeJS 12. Но на более свежих тоже должно работать.
   Подробнее о создании функции для навыка в [документации](https://cloud.yandex.ru/docs/functions/tutorials/alice-skill).
2. Создайте приватный навык. Важные настройки:

<img src="https://github.com/kodilo-inc/notion-alice/blob/main/private-skill-settings.png?raw=true" width="500">

Подробнее о создании навыка в [документации](https://yandex.ru/dev/dialogs/alice/doc/publish.html).

## Какие команды поддерживает
Навык можно настроить для списка и для таблицы. Часть команд по-разному работает для списка и для таблицы.

| Команда | Результат для списка | Результат для таблицы |
| :-- |:--: | :--: |
| Попроси добавить в список <что добавить в список> | Это нужно говорить за пределами навыка. Алиса запустит навык, добавит новый элемент в Notion и выйдет из навыка | Такой же, как для списка |
| reset | Сбросит настройки навыка. Можно будет заново настроить навык | Такой же, как для списка |
| Покажи настройки | Покажет сохраненный токен и id-заметки |  Такой же, как для списка |
| Помощь | Навык расскажет, что умеет | Такой же, как для списка |
| Любые слова/словосочетания, кроме тех, что выше | Добавит слово/словосочетание в список | Такой же, как для списка |
