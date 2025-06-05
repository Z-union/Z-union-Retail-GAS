/** @OnlyCurrentDoc */
const ZUNION_URL = "https://eko.z-union.ru/time-series/predict";

/**
 * Makes request to Z-union API.
 */
function fetchData(times, values, target=2) {
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
 * Creates menu UI in spreadsheet.
 */
function createCustomMenu() {
  let menu = SpreadsheetApp.getUi().createMenu("Modeling");
  menu.addItem("Create sheet", "createSheet");
  menu.addToUi();
}


/**
 * Trigger that creates menu.
 * @param {Dictionary} e
 */
function onOpen(e) {
  createCustomMenu();
}


/**
 * Trigger that sets font parameters.
 * @param {Dictionary} e
 */
function onEdit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetOutput = ss.getSheetByName("Item"); 
  sheetOutput.getRange(1, 1, 300, 100)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setFontFamily("Raleway");
}
