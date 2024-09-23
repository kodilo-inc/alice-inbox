const {
  HELP_TXT,
  HELP_TXT_DURING_SETTING_UP,
  INITIAL_WITHOUT_SCREEN_TXT,
  INITIAL_AFTER_RESET_TXT,
  INSTRUCTION,
  ACTIVATION_PHRASE,
  WRONG_SETTINGS_TXT,
  SETTING_UP_FINISHED,
  nameForSkillToStartList,
} = require("./texts");

const { INITIAL_STEP } = require("./constants");
const {
  getInitialWithScreenResponse,
  addToList,
  extractSettings,
  getColumnId,
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
  const projectId = stateUser && stateUser.projectId;
  const boardId = stateUser && stateUser.boardId;
  const columnId = stateUser && stateUser.columnId;
  const hasScreen = meta.interfaces.screen;

  if (userTells === "reset") {
    response.text = INITIAL_AFTER_RESET_TXT;

    const session_state = {
      previousStep: INITIAL_STEP,
      previousVal: null,
    };

    response.buttons = [
      {
        title: INSTRUCTION,
        hide: false,
        url: "https://rutube.ru/video/31ec9043503c09589d5a33c1d2948204/?r=wd&t=267",
      },
    ];

    const user_state_update = {
      token: null,
      projectId: null,
      boardId: null,
      columnId: null,
    };
    return { version, session, response, session_state, user_state_update };
  }
  if (userTellsInLowerCase === "покажи настройки") {
    response.text = `Токен: ${token}\n\nномер проекта: ${projectId}\n\nномер доски: ${boardId}`;
    const session_state = {
      previousStep,
    };
    return { version, session, response, session_state };
  }

  // Навык НЕ настроен
  if (!token || !projectId || !boardId) {
    if (
      userTellsInLowerCase === "помощь" ||
      userTellsInLowerCase.includes("что ты умеешь")
    ) {
      response.text = HELP_TXT_DURING_SETTING_UP;
      const session_state = {
        previousStep: INITIAL_STEP,
      };
      return { version, session, response, session_state };
    }

    if (!hasScreen) {
      response.text = INITIAL_WITHOUT_SCREEN_TXT;
      return { version, session, response };
    }

    if (session.new) {
      return getInitialWithScreenResponse(event, response);
    }

    const [_token, _projectId, _boardId] = extractSettings(userTells);

    if (!_token || !_projectId || !_boardId) {
      response.text = WRONG_SETTINGS_TXT;
      return { version, session, response };
    }

    response.text = SETTING_UP_FINISHED;
    const user_state_update = {
      token: _token,
      projectId: _projectId,
      boardId: _boardId,
    };

    return {
      version,
      session,
      response,
      user_state_update,
    };
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
    response.text = "Скажи, что добавить в Weeek";
    response.tts = "Скажи , что добавить в вик";
    return { version, session, response };
  }

  let _columnId;
  if (!columnId) {
    _columnId = await getColumnId(boardId, token);
  }
  return addToList(projectId, boardId, columnId || _columnId, userTells, token)
    .then((re) => {
      response.text = `Добавила ${userTells} в список`;
      return {
        version,
        session,
        response,
        user_state_update: _columnId ? { columnId: _columnId } : undefined,
      };
    })
    .catch((error) => {
      if (error && error.message) {
        response.text = `Weeek вернул ошибку: "${error.message}"`;
      } else {
        response.text = `Произошла какая-то ошибка и Weeek не вернул никакого сообщения. Попробуйте задать вопрос в этом телеграм-канале: https://t.me/aliceAddToNotion`;
      }
      return { version, session, response };
    });
};
