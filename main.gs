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
function fetchData(times, values, target) {
  const props = PropertiesService.getScriptProperties();
  const modelName = props.getProperty("TS_MODEL") || "AutoARIMA";
  const fitTimestamps = props.getProperty("FIT_TIMESTAMPS") === "true";
  const seasonality = Number(props.getProperty("SEASONALITY")) || 48;

  console.log(times);
  console.log(values);
  const payload = {
    times: times,
    values: values,
    target: target,
    model_name: modelName,
    fit_timestamps: fitTimestamps,
    seasonality: seasonality
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
  console.log("Forecast:", json.forecast);
  console.log("Timestamps:", json.timestamps);
  return {
    forecast: json.forecast,
    timestamps: json.timestamps || []
  };
}


/**
 * Predicts the values of time series.
 *
 * @param {Array<Array<any>>} history A 2-row range: first row = timestamps, second = values.
 * @param {number} target number of steps to predict.
 * @return {Array<Array<number>>} Horizontal array of predicted values.
 */
function predict(range_str = "H1:DG2", target = 15) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Item");
  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange(range_str);
  const history = range.getValues();

  if (history.length !== 2) {
    throw new Error("History must be 2D: 1st row for timestamps, 2nd for values.");
  }

  const timestamps = history[0]
    .map(e => new Date(e))
    .filter(d => !isNaN(d))
    .map(d => d.toISOString().slice(0, 10));

  const values = history[1].map(Number);
  const result = fetchData(timestamps, values, target);

  if (!result || !Array.isArray(result.forecast)) {
    throw new Error("Invalid forecast result: " + JSON.stringify(result));
  }

  const forecast_filtered = result.forecast.map(v => {
    const val = Math.ceil(v);
    return val < 0 ? 0 : val;
  });

  const forecastDates = result.timestamps;

  const systemPrompt = `
    You are analytics assistant. 
    Your main task is to interpret time series forecast and explain it.
    # Input:
    - Time series: given values of time series
    - Forecast: predicted values of time series
    # Output:
    - String with text interpretation of the forecast.
    ## Additional comments:
    - Considered time series represent sales volume on marketplace.
    - Forecast is made by ARIMA model and is post-processed to be non-negative integers.
    - You should comment forecast based on given time series, e.g. explain zeros or drop.
    - Your response should contain only text with interpretation without any additional comments or wrapping like json.
    - Answer briefly in Russian language.
  `.trim();

  const userPrompt = `Time series: ${values.join(', ')}\nForecast: ${forecast_filtered.join(', ')}`;
  const interpretation = call_llm(systemPrompt, userPrompt);

  const writeStartCol = range.getLastColumn() + 1;
  sheet.getRange(range.getRow() + 1, writeStartCol, 1, forecast_filtered.length)
    .setValues([forecast_filtered]);

  if (forecastDates && forecastDates.length === forecast_filtered.length) {
    sheet.getRange(range.getRow(), writeStartCol, 1, forecastDates.length)
      .setValues([forecastDates]);
  }

  // Plot with EmbeddedChartBuilder  
  const plotStartRow = 50;
  const plotStartCol = 1;

  const header = [["Индекс", "История", "Прогноз"]];
  const allRows = [];

  const totalLen = values.length + forecast_filtered.length;
  for (let i = 0; i < totalLen; i++) {
    const idx = i + 1;
    const histVal = i < values.length ? values[i] : null;
    const forecastVal = i >= values.length ? forecast_filtered[i - values.length] : null;
    allRows.push([idx.toString(), histVal, forecastVal]);
  }

  // Вставка в таблицу
  sheet.getRange(plotStartRow, plotStartCol, 1, 3).setValues(header);
  sheet.getRange(plotStartRow + 1, plotStartCol, allRows.length, 3).setValues(allRows);

  // Построение графика
  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(sheet.getRange(plotStartRow, plotStartCol, allRows.length + 1, 3))
    .setOption("title", "Sales")
    .setOption("curveType", "function")
    .setOption("legend", { position: "bottom" })
    .setOption("series", {
      0: { labelInLegend: "History" },
      1: { labelInLegend: "Forecast" },
    })
    .setOption("pointSize", 3)
    .setOption("lineWidth", 2)
    .setPosition(5, 5, 0, 0) // EA5
    .build();

  sheet.insertChart(chart);

  return interpretation;
}


/**
 * Creates new sheet according to the template.
 */
function createSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
 * Create and predefine models as global parameter.
 */
function initDefaults() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("LLM")) {
    props.setProperty("LLM", "gpt-4.1-mini");
  }
  if (!props.getProperty("TS_MODEL")) {
    props.setProperty("TS_MODEL", "AutoARIMA");
  }
  if (!props.getProperty("FIT_TIMESTAMPS")) {
    props.setProperty("FIT_TIMESTAMPS", true);
  }
  if (!props.getProperty("SEASONALITY")) {
    props.setProperty("SEASONALITY", 48);
  }
}


/**
 * Sets LLM as global parameter.
 */
function selectModel(form) {
  PropertiesService.getScriptProperties().setProperty("LLM", form.model);
  SpreadsheetApp.getActiveSpreadsheet().toast("Current LLM is " + PropertiesService.getScriptProperties().getProperty("LLM") + ".");
}


/**
 * Sets TS_MODEL as global parameter.
 */
// function selectTSModel(modelName) {
//   PropertiesService.getScriptProperties().setProperty("TS_MODEL", modelName);
//   SpreadsheetApp.getActiveSpreadsheet().toast("Current TS model is " + PropertiesService.getScriptProperties().getProperty("TS_MODEL") + ".");
// }


/**
 * Sets time series model and its parameters as global properties.
 * Example payload: { modelName: "AutoTBATS", fitTimestamps: true, seasonality: 48 }
 */
function selectTSModelWithParams(modelName, params) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("TS_MODEL", modelName);
  props.setProperty("FIT_TIMESTAMPS", 
    params.fitTimestamps === undefined ? true : params.fitTimestamps);
  props.setProperty("SEASONALITY", 
    params.seasonality === undefined ? 48 : Number(params.seasonality));
  SpreadsheetApp.getActiveSpreadsheet().toast(`Current TS model is ${modelName}`);
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
