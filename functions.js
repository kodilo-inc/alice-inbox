const { APIErrorCode } = require("@notionhq/client");

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

function getTitlePropertyName(notion, databaseId) {
  return notion.databases.retrieve({ database_id: databaseId }).then((response) => {
      const titleProp = Object.keys(response.properties).find(item => response.properties[item].type === 'title');
      return titleProp;
  });
}

function isDatabase(notion, databaseId) {
  return notion.databases.retrieve({database_id: databaseId}).then(() => {
      return true;
  }, (error) => {
      if(error.code === APIErrorCode.ObjectNotFound) {
          return false;
      }

      throw error;
  })
}

function isPage(notion, pageId) {
  return notion.pages.retrieve({page_id: pageId}).then(() => {
      return true;
  }, (error) => {
      if(error.code === APIErrorCode.ObjectNotFound) {
          return false;
      }

      throw error;
  })
}

const addToList = (notion, item, listId) => {
  return isDatabase(notion, listId).then((result) => {
      if(result) {
          return addToDatabase(notion, item, listId);
      } else {
          return isPage(notion, listId).then((result) => {
              if (result) {
                  return addToPage(notion, item, listId);
              } else {
                  throw new Error('Список не найден');
              }
          })  
      }
  })
}

const addToPage = (notion, item, pageId) => {
  return notion.blocks.children.append({
    block_id: pageId,
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

const addToDatabase = (notion, item, databaseId) => {
  return getTitlePropertyName(notion, databaseId).then(propertyName => {
      return notion.pages.create({
          parent: {
              database_id: databaseId,
          },
          properties: {
              [propertyName]: {
                type: 'title',
                title: [
                  {
                    type: 'text',
                    text: {
                      content: item,
                    },
                  },
                ],
              },
          }
      });
  });
}

module.exports = {
  getIsItArticleIdStep,
  getIsItTokenStep,
  getInitialWithScreenResponse,
  getArticleIdSavedSettingUpFinishedResponse,
  addToList,
};
