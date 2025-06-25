<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500&display=swap" rel="stylesheet">
  <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
  <style>
    body {
      font-family: 'Raleway', sans-serif;
      background-color: #000;
      color: #fff;
      padding: 20px;
    }

    form {
      background-color: #333;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
    }

    fieldset {
      background-color: #333;
      border: 1px solid #fff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }

    legend {
      font-weight: 500;
      font-size: 1.2em;
      color: #fff;
      margin-bottom: 10px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: #fff;
      font-weight: 400;
      font-size: 0.9em;
    }

    input[type="radio"] {
      margin-right: 8px;
    }

    .radio-group {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .radio-group label {
      margin: 0;
    }

    input[type="text"] {
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #555;
      background-color: #222;
      color: white;
      box-sizing: border-box;
      font-size: 0.9em;
    }

    input[type="button"] {
      background-color: #007BFF;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }

    input[type="button"]:hover {
      background-color: #0056b3;
    }

    #llm_output {
      background-color: #333;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px;
      width: 100%;
      height: 120px;
      box-sizing: border-box;
      font-size: 0.9em;
      overflow: auto;
      resize: none; /* ⛔ Убирает треугольник и запрет на ручное изменение размера */
      scrollbar-width: none; /* Firefox */
    }

    #llm_output::-webkit-scrollbar {
      display: none; /* Chrome, Safari */
    }

    .tab-container {
      display: flex;
      margin-bottom: 10px;
    }

    .tab-button {
      flex: 1;
      padding: 10px;
      background-color: #222;
      color: #fff;
      border: none;
      cursor: pointer;
      font-weight: 500;
      border-radius: 0;
    }

    .tab-button:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    .tab-button:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    .tab-button.active {
      background-color: #007BFF;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .form-group {
      margin-bottom: 10px;
    }

    .switch-label {
      font-size: 0.9em;
      margin-bottom: 4px;
    }

    label.switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }

    label.switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    label.switch .slider {
      position: absolute;
      cursor: pointer;
      background-color: #ccc;
      border-radius: 34px;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transition: 0.4s;
    }

    label.switch .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.4s;
    }

    label.switch input:checked + .slider {
      background-color: #007BFF;
    }

    label.switch input:checked + .slider:before {
      transform: translateX(20px);
    }

    .ts-options {
      margin-left: 24px;
    }

    .spacer {
      height: 20px;
    }
  </style>
  <script>
    google.charts.load('current', {'packages':['corechart']});

    function drawChart(history, forecast) {
      google.charts.setOnLoadCallback(() => {
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Index');
        data.addColumn('number', 'History');
        data.addColumn('number', 'Forecast');

        const rows = [];
        for (let i = 0; i < history.length; i++) {
          rows.push([i, history[i], null]);
        }
        for (let i = 0; i < forecast.length; i++) {
          rows.push([history.length + i, null, forecast[i]]);
        }
        data.addRows(rows);

        const options = {
          curveType: 'function',
          legend: {
            position: 'bottom',
            textStyle: { color: '#fff' }
          },
          backgroundColor: 'transparent',
          chartArea: {
            backgroundColor: 'transparent',
            width: '85%',
            height: '70%'
          },
          hAxis: {
            textStyle: { color: '#fff' },
            gridlines: { color: 'transparent' },
            baselineColor: 'transparent',
            ticks: []  // Тики X удалены
          },
          vAxis: {
            textStyle: { color: '#fff' },
            gridlines: { color: 'transparent' },
            baselineColor: 'transparent',
            ticks: []  // Тики Y удалены
          },
          series: {
            0: { labelInLegend: 'History', color: '#4A90E2' },
            1: { labelInLegend: 'Forecast', color: '#E74C3C' }
          },
          pointSize: 2,
          lineWidth: 2
        };

        const chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);
      });
    }


    function switchTab(tabId) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`[data-tab='${tabId}']`).classList.add('active');
    }

    function submitForm() {
      var form = document.getElementById("llmForm");
      if (form.model.value) {
        google.script.run.selectModel(form);
      } else {
        alert("Please select LLM.");
      }
    }

    function submitTSForm() {
      const model = document.querySelector('input[name="ts_model"]:checked');
      if (!model) return alert("Please select a time series model.");
      const selectedModel = model.value;
      const params = {};
      if (selectedModel === "AutoARIMA") {
        params.fitTimestamps = document.getElementById("arima_fit_timestamps").checked;
      } else if (selectedModel === "AutoTBATS") {
        params.fitTimestamps = document.getElementById("tbats_fit_timestamps").checked;
        params.seasonality = parseInt(document.getElementById("tbats_seasonality").value) || 48;
      }
      google.script.run.selectTSModelWithParams(selectedModel, params);
    }

    function runForecast() {
      const history = document.getElementById("history").value;
      const target = document.getElementById("target").value;
      if (!history || !target) return alert("Please set all parameters.");
      google.script.run.withSuccessHandler(function (result) {
        document.getElementById("llm_output").value = result.interpretation || JSON.stringify(result);
        drawChart(result.history, result.forecast);
      }).predict(history, parseInt(target));
    }

    window.onload = function () {
      document.querySelector('[data-tab="forecast"]').click();

      const tsRadios = document.querySelectorAll('input[name="ts_model"]');
      const options = {
        autoarima: document.getElementById('autoarima-options'),
        autotbats: document.getElementById('autotbats-options'),
      };

      function updateTSOptions() {
        const selected = document.querySelector('input[name="ts_model"]:checked')?.id;
        for (const key in options) {
          options[key].style.display = key === selected ? 'block' : 'none';
        }
      }

      tsRadios.forEach(radio => radio.addEventListener('change', updateTSOptions));
      updateTSOptions();
    };
  </script>
</head>
<body>
  <div class="tab-container">
    <button class="tab-button" data-tab="forecast" onclick="switchTab('forecast')">Forecast</button>
    <button class="tab-button" data-tab="settings" onclick="switchTab('settings')">Settings</button>
  </div>

  <div id="forecast" class="tab-content">
    <form>
      <fieldset>
        <legend>Forecast</legend>
        <label for="history">History Range</label>
        <input type="text" id="history" placeholder="H1:M2"><br><br>
        <label for="target">Forecast Length</label>
        <input type="text" id="target" placeholder="5"><br><br>
        <input type="button" value="Predict" onclick="runForecast();">
      </fieldset>
    </form>

    <div class="spacer"></div>

    <form>
      <fieldset>
        <legend>Interpretation</legend>
        <textarea id="llm_output" rows="6" readonly></textarea>
      </fieldset>
    </form>

    <div class="spacer"></div>

    <form>
      <fieldset>
        <legend>Chart</legend>
        <div id="chart_div" style="width: 100%; max-width: 300px; height: 200px; margin: auto;"></div>
      </fieldset>
    </form>
  </div>

  <div id="settings" class="tab-content">
    <form id="tsForm">
      <fieldset>
        <legend>TS Model</legend>
        <div class="radio-group">
          <input type="radio" id="autoarima" name="ts_model" value="AutoARIMA">
          <label for="autoarima">AutoARIMA</label>
        </div>
        <div id="autoarima-options" class="ts-options" style="display:none;">
          <div class="form-group">
            <label class="switch-label">Fit timestamps</label>
            <label class="switch">
              <input type="checkbox" id="arima_fit_timestamps" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="radio-group">
          <input type="radio" id="autotbats" name="ts_model" value="AutoTBATS">
          <label for="autotbats">AutoTBATS</label>
        </div>
        <div id="autotbats-options" class="ts-options" style="display:none;">
          <div class="form-group">
            <label class="switch-label">Fit timestamps</label>
            <label class="switch">
              <input type="checkbox" id="tbats_fit_timestamps" checked>
              <span class="slider"></span>
            </label>
          </div>
          <div class="form-group">
            <label for="tbats_seasonality">Seasonality</label>
            <input type="text" id="tbats_seasonality" value="48" style="width: 80px;">
          </div>
        </div>
      </fieldset>
      <input type="button" value="Submit" onclick="submitTSForm();">
    </form>

    <div class="spacer"></div>

    <form id="llmForm">
      <fieldset>
        <legend>LLM</legend>
        <div class="radio-group">
          <input type="radio" id="gpt-4o-mini" name="model" value="gpt-4o-mini">
          <label for="gpt-4o-mini">GPT 4 (Omni mini)</label>
        </div>
        <div class="radio-group">
          <input type="radio" id="gpt-4.1-nano" name="model" value="gpt-4.1-nano">
          <label for="gpt-4.1-nano">GPT 4.1 (nano)</label>
        </div>
        <div class="radio-group">
          <input type="radio" id="gpt-4.1-mini" name="model" value="gpt-4.1-mini">
          <label for="gpt-4.1-mini">GPT 4.1 (mini)</label>
        </div>
      </fieldset>
      <input type="button" value="Submit" onclick="submitForm();">
    </form>
  </div>
</body>
</html>
