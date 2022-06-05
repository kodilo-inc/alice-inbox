const { Client } = require("@notionhq/client");

const INITIAL_STEP = 0;
const HERE_INSTRUCTION_STEP = 1;
const SETTING_UP_TOKEN_AND_ID_STEP = 2;
const IS_IT_TOKEN_STEP = 3;
const TOKEN_SAVED_STEP = 4;
const ARTICLE_ID_SAVED_STEP = 5;
const IS_IT_ARTICLE_ID_STEP = 6;

// dialog's texts
const HELP_TXT =
  "Через меня можно голосом наполнять списки в Notion.\n" +
  'Чтобы не заходя в навык добавить в список, например, молоко, скажите Алисе: "Попроси добавить в список молоко"\n' +
  "Чтобы сбросить настройки навыка, пришлите мне слово reset с маленькой буквы.\n" +
  'Отправьте "Покажи настройки", чтобы посмотреть сохраненный токен и id-заметки.\n' +
  "Если есть непреодолимые проблемы, напишите мне в телеграм: @novitckas";
const HELP_TXT_DURING_SETTING_UP = 'Через меня можно голосом наполнять списки в Notion. Но для начала работы меня нужно настроить. Для настройки вам понадобится аккаунт в Notion.\n' +
  'Если есть непреодолимые проблемы, напишите мне в телеграм: @novitckas \n\n' +
  'Готовы начать настройку навыка?'
const INITIAL_WITH_SCREEN_TXT =
  "Через меня можно голосом наполнять списки в Notion. Но для начала работы меня нужно настроить. Готовы начать настройку?";
const INITIAL_WITHOUT_SCREEN_TXT =
  'Через меня можно голосом наполнять списки в Notion. Но для начала работы меня нужно настроить. Чтобы начать настройку, запустите навык на устройстве с клавиатурой. Например, в приложении "Яндекс" на смартфоне.';
const INITIAL_AFTER_RESET_TXT =
  "Сбросила настройки навыка. Начнём настройку заново?";
const HERE_INSTRUCTION_TXT =
  "Я подготовила инструкцию. Настройка займёт 5-10 минут.\n" +
  "\n" +
  "Настройки сохранятся для всех устройств, привязанных к вашему аккаунту Яндекса.\n" +
  "\n" +
  'Чтобы открыть инструкцию, нажмите кнопку "Инструкция"';
const IS_IT_TOKEN_TXT = "Это токен Notion'а?";
const IS_IT_ARTICLE_ID_TXT = "Это id-заметки?";
const TOKEN_SAVED_TXT = "Сохранила токен";
const ARTICLE_ID_SAVED_TXT = "Сохранила id заметки";
const TOKEN_SAVED_SETTING_UP_FINISHED =
  "Сохранила токен Notion'а!\n" +
  "\n" +
  "Навык настроен. Теперь можно пользоваться. Просто скажите, что добавить в список.\n" +
  "\n" +
  'Чтобы добавить в список, не заходя в навык, скажите Алисе: "попроси добавить в список молоко"\n' +
  "\n" +
  'Если захотите сбросить настройки, скажите отправьте слово "reset" (с маленькой буквы).';

const ARTICLE_ID_SAVED_SETTING_UP_FINISHED =
  "Сохранила id заметки!\n" +
  "\n" +
  "Навык настроен. Теперь можно пользоваться. Просто скажите, что добавить в список.\n" +
  "\n" +
  'Чтобы добавить в список, не заходя в навык, скажите Алисе: "попроси добавить в список молоко"\n' +
  "\n" +
  'Если захотите сбросить настройки, скажите отправьте слово "reset" (с маленькой буквы).';

// btn's texts
const YES = "Да";
const NO = "Нет";
const INSTRUCTION = "Инструкция";
const NO_ITS_ID = "Нет, это id заметки";
const NO_ITS_TOKEN = "Нет, это токен Notion'а";

const addToList = (notion, item, articleId) => {
  return notion.blocks.children.append({
    block_id: articleId,
    children: [
      {
        object: "block",
        type: "to_do",
        to_do: {
          rich_text: [
            {
              type: "text",
              text: {
                content: item,
              },
            },
          ],
          checked: false,
        },
      },
    ],
  });
};

module.exports.handler = async (event, context) => {
  const { request, session, version, meta, state } = event;
  let response = {};
  const stateSession = state && state.session
  const stateUser = state && state.user
  const userTells = request.original_utterance;
  const previousStep = stateSession && stateSession.previousStep;
  const userTellsOnPreviousStep = stateSession && stateSession.previousVal;
  const token = stateUser && stateUser.token;
  const articleId = stateUser && stateUser.id;
  const hasScreen = meta.interfaces.screen;

  if (userTells === "reset") {
    response.text = INITIAL_AFTER_RESET_TXT;
    response.buttons = [
      { title: YES, hide: true },
      { title: NO, hide: true },
    ];

    const session_state = {
      previousStep: INITIAL_STEP,
      previousVal: null,
    };

    const user_state_update = {
      token: null,
      id: null,
    };
    return { version, session, response, session_state, user_state_update };
  }
  if (userTells.toLowerCase() === 'покажи настройки') {
    response.text = `Токен: ${token}\n\nid-заметки: ${articleId}`
    const session_state = {
      previousStep,
    };
    return { version, session, response, session_state };
  }

  // Навык НЕ настроен (отсутствуют токен и id заметки).
  if (!token|| !articleId) {
    if (userTells.toLowerCase() === "помощь" || userTells.toLowerCase().includes('что ты умеешь')) {
      response.text = HELP_TXT_DURING_SETTING_UP;
      response.buttons = [
        { title: YES, hide: true },
      ];
      const session_state = {
        previousStep: INITIAL_STEP,
      };
      return { version, session, response, session_state };
    }


    // Miro стрелка "Первый раз с устройства без экрана" https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215212991&cot=14
    if (!hasScreen) {
      response.text = INITIAL_WITHOUT_SCREEN_TXT;
      return { version, session, response };
    }

    // MIRO стрелка: "Первый раз. С устройства с экраном" https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215027652&cot=14
    if (session.new) {
      return getInitialWithScreenResponse();
    }

    // Пользователь пришёл отсюда https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364214922267&cot=14
    if (previousStep === INITIAL_STEP) {
      // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215382360&cot=14
      if (userTells === YES) {
        response.text = HERE_INSTRUCTION_TXT;
        response.buttons = [
          {
            title: INSTRUCTION,
            hide: false,
            url: "https://kodilo.notion.site/e8da9e9e4b2545aaa163f56de7995973",
          },
        ];
        const session_state = {
          previousStep: HERE_INSTRUCTION_STEP,
        };
        return { version, session, response, session_state };
      }
      // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364218739833&cot=14
      return getInitialWithScreenResponse();
    }

    // Пользователь пришёл отсюда: https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215382366&cot=14
    // или отсюда: https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215598058&cot=14
    // или отсюда https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216865822&cot=14
    // вот сюда https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215598058&cot=14
    if (
      previousStep === HERE_INSTRUCTION_STEP ||
      previousStep === SETTING_UP_TOKEN_AND_ID_STEP ||
      previousStep === ARTICLE_ID_SAVED_STEP
    ) {
      return getIsItTokenStep();
    }

    // Пользователь пришёл отсюда https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364215598058&cot=14
    if (previousStep === IS_IT_TOKEN_STEP) {
      if (userTells === YES) {
        // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364217301284&cot=14
        if (articleId) {
          response.text = TOKEN_SAVED_SETTING_UP_FINISHED;
          const session_state = {
            previousStep: null,
            previousVal: null,
          };

          const user_state_update = {
            token: userTellsOnPreviousStep,
          };

          return {
            version,
            session,
            response,
            session_state,
            user_state_update,
          };
        }
        // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216759463&cot=14
        response.text = TOKEN_SAVED_TXT;
        const session_state = {
          previousStep: TOKEN_SAVED_STEP,
          previousVal: null,
        };

        const user_state_update = {
          token: userTellsOnPreviousStep,
        };

        return { version, session, response, session_state, user_state_update };
      }
      if (userTells === NO_ITS_ID) {
        // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364554156131&cot=14
        if (token) {
          return getArticleIdSavedSettingUpFinishedResponse();
        }
        // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216865735&cot=14
        response.text = ARTICLE_ID_SAVED_TXT;
        const session_state = {
          previousStep: ARTICLE_ID_SAVED_STEP,
          previousVal: null,
        };
        const user_state_update = {
          id: userTellsOnPreviousStep,
        };
        return { version, session, response, session_state, user_state_update };
      }

      // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216618317&cot=14
      return getIsItTokenStep();
    }

    // Пользователь пришёл отсюда: https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216759466&cot=14
    if (previousStep === TOKEN_SAVED_STEP) {
      return getIsItArticleIdStep();
    }
    // Пользователь пришёл отсюда: https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364216759557&cot=14
    if (previousStep === IS_IT_ARTICLE_ID_STEP) {
      // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364605135373&cot=14
      if (userTells === NO_ITS_TOKEN) {
        response.text = TOKEN_SAVED_TXT;
        const session_state = {
          previousStep: TOKEN_SAVED_STEP,
          previousVal: null,
        };

        const user_state_update = {
          id: userTellsOnPreviousStep,
        };

        return { version, session, response, session_state, user_state_update };
      }
      // https://miro.com/app/board/o9J_ldpPWOU=/?moveToWidget=3074457364217394216&cot=14
      if (userTells === YES) {
        return getArticleIdSavedSettingUpFinishedResponse();
      }

      return getIsItArticleIdStep();
    }
  }

  function getIsItArticleIdStep() {
    response.text = IS_IT_ARTICLE_ID_TXT;
    response.buttons = [
      { title: YES, hide: true },
      { title: NO_ITS_TOKEN, hide: true },
    ];
    const session_state = {
      previousStep: IS_IT_ARTICLE_ID_STEP,
      previousVal: userTells,
    };
    return { version, session, response, session_state };
  }

  function getIsItTokenStep() {
    response.text = IS_IT_TOKEN_TXT;
    response.buttons = [
      { title: YES, hide: true },
      { title: NO_ITS_ID, hide: true },
    ];
    const session_state = {
      previousStep: IS_IT_TOKEN_STEP,
      previousVal: userTells,
    };
    return { version, session, response, session_state };
  }

  function getInitialWithScreenResponse() {
    response.text = INITIAL_WITH_SCREEN_TXT;
    response.buttons = [
      { title: YES, hide: true },
      { title: NO, hide: true },
    ];
    const session_state = {
      previousStep: INITIAL_STEP,
    };
    return { version, session, response, session_state };
  }

  function getArticleIdSavedSettingUpFinishedResponse() {
    response.text = ARTICLE_ID_SAVED_SETTING_UP_FINISHED;
    const session_state = {
      previousStep: null,
      previousVal: null,
    };
    const user_state_update = {
      id: userTellsOnPreviousStep,
    };
    return { version, session, response, session_state, user_state_update };
  }

  // Пример быстрого запуска навыка: "Алиса, попроси {название навыка} {входные данные для навыка}".
  // Алиса запустит навык и сразу передаст в него входные параметры.
  const isFastSkillCall = request.original_utterance && session.new;

  response.end_session = isFastSkillCall; // После быстрого запуска сразу завершаем навык. Несколько раз было неожиданно, что воспользовался навыком.
  // Через 5 минут ставлю таймер, а я, оказывается, всё еще в навыке.
  if (userTells.toLowerCase() === "помощь" || userTells.toLowerCase().includes('что ты умеешь')) {
    response.text = HELP_TXT;
    const session_state = {
      previousStep: INITIAL_STEP,
    };
    return { version, session, response, session_state };
  }

  if (!request.original_utterance || request.original_utterance === "ping") {
    response.text = "Скажи, что добавить в Notion";
    response.tts = "Скажи , что добавить в ноушн";
    return { version, session, response };
  }
  const notion = new Client({
    auth: token,
  });

  return addToList(notion, request.original_utterance, articleId).then(() => {
    response.text = `Добавила ${request.original_utterance} в список`;
    return { version, session, response };
  }).catch((error) => {
    if (error && error.message) {
      response.text = `Notion вернул ошибку: "${error.message}"`
    } else {
      response.text = `Произошла какая-то ошибка и Notion не вернул никакого сообщения. Попробуйте задать вопрос в этом телеграм-канале: https://t.me/aliceAddToNotion`
    }
    return { version, session, response };

  });
};
