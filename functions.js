const {
  IS_IT_ARTICLE_ID_TXT,
  YES,
  NO_ITS_TOKEN,
  IS_IT_TOKEN_TXT,
  NO_ITS_ID,
  INITIAL_WITH_SCREEN_TXT,
  NO,
  ARTICLE_ID_SAVED_SETTING_UP_FINISHED,
} = require("./texts");
const {
  IS_IT_ARTICLE_ID_STEP,
  IS_IT_TOKEN_STEP,
  INITIAL_STEP,
} = require("./constants");

const getIsItArticleIdStep = (event, response, userTells) => {
  const { session, version } = event;
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
};

function getIsItTokenStep(event, response, userTells) {
  const { version, session } = event;
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

function getInitialWithScreenResponse(event, response) {
  const { session, version } = event;
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

function getArticleIdSavedSettingUpFinishedResponse(
  event,
  response,
  userTellsOnPreviousStep
) {
  const { session, version } = event;
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

module.exports = {
  getIsItArticleIdStep,
  getIsItTokenStep,
  getInitialWithScreenResponse,
  getArticleIdSavedSettingUpFinishedResponse,
  addToList,
};
