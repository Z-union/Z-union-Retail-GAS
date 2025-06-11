/** @OnlyCurrentDoc */
const ZUNION_URL = "https://eko.z-union.ru/time-series/predict";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = "";


/**
 * Makes request to Openai GPT API.
 */
function fetchDataGPT(systemContent, userContent) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    }

    const options = {
      headers,
      method: "GET",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        "model": PropertiesService.getScriptProperties().getProperty("LLM"),
        "messages": [
          {
            "role": "system",
            "content": systemContent
          },
          {
            "role": "user",
            "content": userContent
          }
        ],
        "temperature": 0.1
      })
    } 

    const response = JSON.parse(UrlFetchApp.fetch(OPENAI_API_URL, options));
    console.log(response);
    console.log(String(response.choices[0].message.content).slice(-10));
    return response.choices[0].message.content;
  } catch (e) {
    console.log("fetch error\n" + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("Error during OpenAI API call.");
    return "Error during OpenAI API call.";
  }
}


/**
 * Manages request to LLM.
 */
function call_llm(systemContent, userContent, llmType=null) {
  var response = "";
  if (!llmType) {
    llmType = PropertiesService.getScriptProperties().getProperty("LLM");
  }
  try {
    if (llmType.includes("claude")) {
      response = fetchDataClaude(systemContent, userContent);
    } else if (llmType.includes("deepseek")) {
      response = fetchDataDeepSeek(systemContent, userContent);
    } else if (llmType.includes("gemini")) {
      response = fetchDataGemini(systemContent, userContent, llmType);
    } else if (llmType.includes("codestral")) {
      response = fetchDataZ_LLM(systemContent, userContent, projectSteps.join(', '));
    } else {
      response = fetchDataGPT(systemContent, userContent, llmType);
    }
  } catch (e) {
    console.log("Error calling LLM: " + e.message);
    response = "Error: " + e.message;
  }
  return response;
}


/**
 * Makes request to Z-union API.
 */
function fetchData(times=['2025-06-01', '2025-06-08', '2025-06-15', '2025-06-22', '2025-06-29', '2025-07-06', '2025-07-13', '2025-07-20', '2025-07-27', '2025-08-03'], values=[16, 15, 12, 10, 15, 20, 22, 14, 15, 16], target=2) {
  const payload = {
    times: times,
    values: values,
    target: target
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(ZUNION_URL, options);
  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error("Error: " + code + " → " + response.getContentText());
  }
  const json = JSON.parse(response.getContentText());
  console.log(json.forecast);
  return json.forecast;
}


/**
 * Predicts the values of time series.
 *
 * @param {Array<Array<any>>} history A 2-row range: first row = timestamps, second = values.
 * @param {number} target number of steps to predict.
 * @return {Array<Array<number>>} Horizontal array of predicted values.
 * @customfunction
 */
function predict(history, target) {
  if (!Array.isArray(history) || history.length !== 2) {
    throw new Error("History must be 2D: 1st row for timestamps, 2nd for values.");
  }
  const timestamps = history[0]
    .map(e => new Date(e))                  
    .filter(d => !isNaN(d))                    
    .map(d => d.toISOString().slice(0, 10));
  const values = history[1].map(Number);
  const forecast = fetchData(timestamps, values, target);
  const forecast_filtered = forecast.map(v => {
    const val = Math.ceil(v);
    return val < 0 ? 0 : val;
  });

  var systemContent = `
    You are analytics assistant. 
    Your main task is to interpret time series forcast and explain it.
    # Input:
    - Time series: given values of time series
    - Forecast: predicted values of time series
    # Output:
    - String with text interpretation of the forcast.
    ## Additional comments:
    - Considered time series represent sales volume on marketplace.
    - Forecast is made by ARIMA model and is post-processed to be non-negative integers.
    - You should comment forecast based on given time series, e.g. explain zeros or drop.
    - Your response should contain only text with interpretation without any additional comments or wrapping like json.
    - Answer briefly in Russian language.
  `.trim();
  var userContent = `Time series: ${values.join(', ')}\nForecast: ${forecast_filtered.join(', ')}`;
  var interpretation = call_llm(systemContent, userContent);
  PropertiesService.getScriptProperties().setProperty("INTERPRETATION", interpretation);

  return [forecast_filtered];
}


/**
 * Creates new sheet according to the template.
 * @customfunction
 */
function createSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create new empy Sheet for item
  var sheetItem = ss.getSheetByName("Item");
  if (sheetItem != null) {
      ss.deleteSheet(sheetItem);
  }
  sheetItem = ss.insertSheet();
  sheetItem.setName("Item");

  var headerRows = [[
    "Бренд",
    "Вид",
    "Модель",
    "Артикул",
    "Размер",
    "Штрихкод",
    "Статья"
  ]];

  sheetItem.getRange(1, 1, 1, 7).setValues(headerRows)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBackground('#F174DD')
    .setFontWeight("bold");

  var headerCols = [
    ["Выкуп"],
    ["Доля выкупа"],
    ["Заказ"]
  ];

  sheetItem.getRange(2, 7, 3, 1).setValues(headerCols)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBackground('#D35CD1');

  sheetItem.getRange(2, 1, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
  sheetItem.getRange(2, 2, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
  sheetItem.getRange(2, 3, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
  sheetItem.getRange(2, 4, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
  sheetItem.getRange(2, 5, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
  sheetItem.getRange(2, 6, 3, 1).merge()
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)

  sheetItem.setColumnWidths(1, 1, 200);
  sheetItem.setColumnWidths(2, 1, 200);
  sheetItem.setColumnWidths(3, 1, 200);
  sheetItem.setColumnWidths(4, 1, 200);
  sheetItem.setColumnWidths(5, 1, 70);
  sheetItem.setColumnWidths(6, 1, 200);

  sheetItem.getRange("A:F").shiftColumnGroupDepth(1);
  const group = sheetItem.getColumnGroup(1, 1);
  // group.collapse();
}


/**
 * Shows sidebar with settings.
 */
function showSidebar() {
  var widget = HtmlService.createHtmlOutputFromFile("sidebar.html");
  widget.setTitle("AI Functions");
  SpreadsheetApp.getUi().showSidebar(widget);
}

/**
 * Create and predefine LLM as global parameter.
 */
function initDefaults() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("LLM")) {
    props.setProperty("LLM", "gpt-4.1-mini");
  }
}


/**
 * Sets LLM as global parameter.
 */
function selectModel(form) {
  PropertiesService.getScriptProperties().setProperty("LLM", form.model);
  SpreadsheetApp.getActiveSpreadsheet().toast("Current model is " + PropertiesService.getScriptProperties().getProperty("LLM") + ".");
}


/**
 * Gets LLM interpretation of the forecast.
 */
function getInterpretation() {
  return PropertiesService.getScriptProperties().getProperty("INTERPRETATION");
}


/**
 * Creates menu UI in spreadsheet.
 */
function createCustomMenu() {
  let menu = SpreadsheetApp.getUi().createMenu("Modeling");
  menu.addItem("Create sheet", "createSheet");
  menu.addItem("Show sidebar", "showSidebar");
  menu.addToUi();
}


/**
 * Trigger that creates menu.
 * @param {Dictionary} e
 */
function onOpen(e) {
  initDefaults();
  createCustomMenu();
}


/**
 * Trigger that sets font parameters.
 * @param {Dictionary} e
 */
function onEdit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOutput = ss.getSheetByName("ItemTest"); 
  sheetOutput.getRange(1, 1, 300, 100)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Raleway");
  var sheetOutput = ss.getSheetByName("ItemTest"); 
  sheetOutput.getRange(1, 1, 300, 100)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Raleway");
}
