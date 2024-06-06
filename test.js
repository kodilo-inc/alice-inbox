// файл нужен для тестирования функций из ./functions.js во время разработки

const {
  getIsItArticleIdStep,
  getIsItTokenStep,
  getInitialWithScreenResponse,
  getArticleIdSavedSettingUpFinishedResponse,
  addToList,
  showList,
  deleteItemFormListByText,
} = require("./functions");

const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: "secret_VkMBwmtlC2aCc2qMs9qjNaChM6WHIHBiABYob9bRE8g",
});

// showList(notion, "209db8e89935430a8e65c71b2eeca615")
//   .then(console.log)
//   .catch(console.log);

deleteItemFormListByText(
  notion,
  "209db8e89935430a8e65c71b2eeca615",
  "Покажи Список"
);
