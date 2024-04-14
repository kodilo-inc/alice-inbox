const { Client } = require("@notionhq/client");
const {
  HELP_TXT,
  HELP_TXT_DURING_SETTING_UP,
  INITIAL_WITHOUT_SCREEN_TXT,
  INITIAL_AFTER_RESET_TXT,
  HERE_INSTRUCTION_TXT,
  TOKEN_SAVED_TXT,
  ARTICLE_ID_SAVED_TXT,
  TOKEN_SAVED_SETTING_UP_FINISHED,
  YES,
  NO,
  INSTRUCTION,
  NO_ITS_ID,
  NO_ITS_TOKEN,
  ACTIVATION_PHRASE,
  nameForSkillToStartList,
} = require("./texts");

const {
  INITIAL_STEP,
  HERE_INSTRUCTION_STEP,
  SETTING_UP_TOKEN_AND_ID_STEP,
  IS_IT_TOKEN_STEP,
  TOKEN_SAVED_STEP,
  ARTICLE_ID_SAVED_STEP,
  IS_IT_ARTICLE_ID_STEP,
} = require("./constants");
const {
  getIsItArticleIdStep,
  getIsItTokenStep,
  getInitialWithScreenResponse,
  getArticleIdSavedSettingUpFinishedResponse,
  addToList,
  showList,
} = require("./functions");

module.exports.handler = async (event) => {
  const { request, session, version, meta, state } = event;
  let response = {};
  const stateSession = state && state.session;
  const stateUser = state && state.user;
  const launchPhraseUserUsed = nameForSkillToStartList.filter((i) =>
    request.original_utterance
      .toLowerCase()
      .startsWith(`${ACTIVATION_PHRASE} ${i}`)
  )[0];
  const isUserMessageStartWithLaunchPhrase = !!launchPhraseUserUsed;
  const userTells = isUserMessageStartWithLaunchPhrase
    ? request.original_utterance.slice(
        launchPhraseUserUsed.length + ACTIVATION_PHRASE.length + 1
      )
    : request.original_utterance;
  const userTellsInLowerCase = userTells.toLowerCase();
  const previousStep = stateSession && stateSession.previousStep;
  const userTellsOnPreviousStep = stateSession && stateSession.previousVal;
  const token = stateUser && stateUser.token;
  const articleId = stateUser && stateUser.id;
  const hasScreen = meta.interfaces.screen;
  const notion = new Client({
    auth: token,
  });

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
  if (userTellsInLowerCase === "покажи настройки") {
    response.text = `Токен: ${token}\n\nid-заметки: ${articleId}`;
    const session_state = {
      previousStep,
    };
    return { version, session, response, session_state };
  }

  // Навык НЕ настроен (отсутствуют токен и id заметки).
  if (!token || !articleId) {
    if (
      userTellsInLowerCase === "помощь" ||
      userTellsInLowerCase.includes("что ты умеешь")
    ) {
      response.text = HELP_TXT_DURING_SETTING_UP;
      response.buttons = [{ title: YES, hide: true }];
      const session_state = {
        previousStep: INITIAL_STEP,
      };
      return { version, session, response, session_state };
    }

    // Miro стрелка "Первый раз с устройства без экрана" https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420502&cot=14
    if (!hasScreen) {
      response.text = INITIAL_WITHOUT_SCREEN_TXT;
      return { version, session, response };
    }

    // MIRO стрелка: "Первый раз. С устройства с экраном" https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420500&cot=14
    if (session.new) {
      return getInitialWithScreenResponse(event, response);
    }

    // Пользователь пришёл отсюда https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420499&cot=14
    if (previousStep === INITIAL_STEP) {
      // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420506&cot=14
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
      // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420540&cot=14
      return getInitialWithScreenResponse(event, response);
    }

    // Пользователь пришёл отсюда: https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420505&cot=14
    // или отсюда: https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420507&cot=14
    // или отсюда https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420514&cot=14
    // вот сюда https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420507&cot=14
    if (
      previousStep === HERE_INSTRUCTION_STEP ||
      previousStep === SETTING_UP_TOKEN_AND_ID_STEP ||
      previousStep === ARTICLE_ID_SAVED_STEP
    ) {
      return getIsItTokenStep(event, response, userTells);
    }

    // Пользователь пришёл отсюда https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420507&cot=14
    if (previousStep === IS_IT_TOKEN_STEP) {
      if (userTells === YES) {
        // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420518&cot=14
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
        // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420511&cot=14
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
        // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420541&cot=14
        if (token) {
          return getArticleIdSavedSettingUpFinishedResponse(
            event,
            response,
            userTellsOnPreviousStep
          );
        }
        // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420515&cot=14
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

      // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420509&cot=14
      return getIsItTokenStep(event, response, userTells);
    }

    // Пользователь пришёл отсюда: https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420510&cot=14
    if (previousStep === TOKEN_SAVED_STEP) {
      return getIsItArticleIdStep(event, response, userTells);
    }
    // Пользователь пришёл отсюда: https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420512&cot=14
    if (previousStep === IS_IT_ARTICLE_ID_STEP) {
      // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420542&cot=14
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
      // https://miro.com/app/board/uXjVOvE1DVc=/?moveToWidget=3458764526870420522&cot=14
      if (userTells === YES) {
        return getArticleIdSavedSettingUpFinishedResponse(
          event,
          response,
          userTellsOnPreviousStep
        );
      }

      return getIsItArticleIdStep(event, response, userTells);
    }
  }

  if (userTellsInLowerCase === "покажи список") {
    return showList(notion, articleId).then((list) => {
      response.text = list;
      return { version, session, response };
    });
  }

  // Пример быстрого запуска навыка: "Алиса, попроси {название навыка} {входные данные для навыка}".
  // Алиса запустит навык и сразу передаст в него входные параметры.
  const isFastSkillCall =
    (request.original_utterance && session.new) ||
    isUserMessageStartWithLaunchPhrase;

  response.end_session = isFastSkillCall; // После быстрого запуска сразу завершаем навык. Несколько раз было неожиданно, что воспользовался навыком.
  // Через 5 минут ставлю таймер, а я, оказывается, всё еще в навыке.
  if (
    userTellsInLowerCase === "помощь" ||
    userTellsInLowerCase.includes("что ты умеешь")
  ) {
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

  return addToList(notion, userTells, articleId)
    .then(() => {
      response.text = `Добавила ${userTells} в список`;
      return { version, session, response };
    })
    .catch((error) => {
      if (error && error.message) {
        response.text = `Notion вернул ошибку: "${error.message}"`;
      } else {
        response.text = `Произошла какая-то ошибка и Notion не вернул никакого сообщения. Попробуйте задать вопрос в этом телеграм-канале: https://t.me/aliceAddToNotion`;
      }
      return { version, session, response };
    });
};
