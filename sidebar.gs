<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Raleway', sans-serif;
      background-color: #000;
      color: #fff;
      padding: 20px;
    }

    h1 {
      color: #fff;
      font-weight: 500;
    }

    form {
      background-color: #333;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: #fff;
      font-weight: 400;
      font-size: 0.9em;
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

    .radio-group {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    input[type="radio"] {
      appearance: auto;
      margin: 0 6px 0 0;
    }

    .radio-group label {
      display: inline;
      margin: 0;
      font-size: 0.95em;
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

    #llm_output {
      background-color: #333;
      color: #fff;
      font-family: 'Raleway', sans-serif;
      border: none;
      border-radius: 4px;
      padding: 8px;
      resize: none;
      box-shadow: none;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      overflow-y: scroll;
      scrollbar-width: none;
      -ms-overflow-style: none;
      font-size: 0.9em;
    }

    #llm_output::-webkit-scrollbar {
      display: none;
    }

    .spacer {
      height: 20px;
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
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .tab-button:first-child {
      border-top-right-radius: 0;
      border-bottom-left-radius: 8px;
    }

    .tab-button:last-child {
      border-top-left-radius: 0;
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

    .tab-button:first-child.active {
      border-top-right-radius: 0;
      border-bottom-left-radius: 8px;
    }

    .tab-button:last-child.active {
      border-top-left-radius: 0;
      border-bottom-right-radius: 8px;
    }

  </style>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`.tab-button[data-tab='${tabId}']`).classList.add('active');
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
      const form = document.getElementById("tsForm");
      if (form.ts_model.value) {
        google.script.run.selectTSModel(form.ts_model.value);
      } else {
        alert("Please select a time series model.");
      }
    }

    function runForecast() {
      const history = document.getElementById("history").value;
      const target = document.getElementById("target").value;
      if (!history || !target) return alert("Please set all parameters.");
      google.script.run.withSuccessHandler(function (interpretation ) {
        document.getElementById("llm_output").value = interpretation  || "";
      }).predict2(history, parseInt(target));
    }

    window.onload = function () {
      document.querySelector('[data-tab="forecast"]').click();
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
        <label for="histiry">History Range</label>
        <input type="text" id="histiry" placeholder="H1:M2"><br><br>
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
  </div>

  <div id="settings" class="tab-content">
    <form id="tsForm">
      <fieldset id="tsmodel">
        <legend>TS Model</legend>
        <!-- <input type="radio" id="autoarima" name="ts_model" value="AutoARIMA">
        <label for="autoarima">AutoARIMA</label><br>
        <input type="radio" id="autotbats" name="ts_model" value="AutoTBATS">
        <label for="autotbats">AutoTBATS</label><br> -->
        <div class="radio-group">
          <input type="radio" id="autoarima" name="ts_model" value="AutoARIMA">
          <label for="autoarima">AutoARIMA</label>
        </div>
        <div class="radio-group">
          <input type="radio" id="autotbats" name="ts_model" value="AutoTBATS">
          <label for="autotbats">AutoTBATS</label>
        </div>
      </fieldset>
      <input type="button" value="Submit" onclick="submitTSForm();">
    </form>

    <div class="spacer"></div>

    <form id="llmForm">
      <fieldset id="openai">
        <legend>LLM</legend>
        <!-- <input type="radio" id="gpt-4o-mini" name="model" value="gpt-4o-mini">
        <label for="gpt-4o-mini">GPT 4 (Omni mini)</label><br>
        <input type="radio" id="gpt-4.1-nano" name="model" value="gpt-4.1-nano">
        <label for="gpt-4.1-nano">GPT 4.1 (nano)</label><br>
        <input type="radio" id="gpt-4.1-mini" name="model" value="gpt-4.1-mini">
        <label for="gpt-4.1-mini">GPT 4.1 (mini)</label><br> -->
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
