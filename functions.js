const { INITIAL_WITH_SCREEN_TXT, INSTRUCTION } = require("./texts");

function getInitialWithScreenResponse(event, response) {
  const { session, version } = event;
  response.text = INITIAL_WITH_SCREEN_TXT;
  response.buttons = [
    {
      title: INSTRUCTION,
      hide: false,
      url: "https://rutube.ru/video/31ec9043503c09589d5a33c1d2948204/?r=wd&t=267",
    },
  ];
  return { version, session, response };
}

const getColumnId = async (boardId, token) => {
  return fetch(
    `https://api.weeek.net/public/v1/tm/board-columns?boardId=${boardId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((resp) => {
      return resp.boardColumns[0].id;
    });
};

const addToList = async (projectId, boardId, columnId, title, token) => {
  const data = {
    title,
    projectId,
    boardId,
    boardColumnId: +columnId,
    type: "action",
  };
  const response = await fetch("https://api.weeek.net/public/v1/tm/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// from a6808400-2582-40d7-8c8c-0add92d66b54,https://app.weeek.net/ws/580690/project/2/board/3 to []
const extractSettings = (userTells) => {
  const [token, url] = userTells.split(",");
  let [projectId, boardId] = extractIds(url) || [];
  return [token, projectId, boardId];
};

function extractIds(url) {
  // Используем регулярное выражение для поиска подстроки 'project/<project_id>/board/<board_id>'
  const regex = /project\/(\d+)\/board\/(\d+)/g;
  let match = regex.exec(url);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10)];
  } else {
    return null;
  }
}

module.exports = {
  getInitialWithScreenResponse,
  addToList,
  extractSettings,
  getColumnId,
};
