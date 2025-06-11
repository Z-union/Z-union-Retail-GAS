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
            background-color: #333; /* Main grey background */
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        label {
            margin-left: 10px;
            color: #fff;
            font-weight: 400;
        }
        fieldset {
            background-color: #333; /* Match the form background color */
            border: 1px solid #fff; /* Thin white stroke for subfields */
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
        /* No additional background colors for subfields, they match the main form */
        input[type="radio"] {
            accent-color: #007BFF;
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
            font-family: 'Roboto', sans-serif;
            border: none;
            border-radius: 4px;
            padding: 8px;
            resize: none;
            box-shadow: none;
            outline: none;
            width: 100%;
            box-sizing: border-box;
            overflow-y: scroll;
            scrollbar-width: none;       /* Firefox */
            -ms-overflow-style: none;    /* Internet Explorer 10+ */
        }
        #llm_output::-webkit-scrollbar {
            display: none;               /* Chrome, Safari, Opera */
        }
        .spacer {
            height: 20px;
        }
    </style>
    <script>
        function submitForm() {
            var form = document.getElementById("modelForm");
            if (form.model.value) {
                google.script.run.selectModel(form);
            } else {
                alert("Please select a model.");
            }
        }

        function runInterpretation() {
          google.script.run.withSuccessHandler(function(result) {
            document.getElementById("llm_output").value = result || "";
          }).getInterpretation();
        }

        window.onload = function () {
          google.script.run.withSuccessHandler(function(result) {
            document.getElementById("llm_output").value = result || "";
          }).getInterpretation();
        };
    </script>
</head>
<body>
    <form id="modelForm">
        <!-- OpenAI API Models -->
        <fieldset id="openai">
            <legend>OpenAI API</legend>
            <input type="radio" id="gpt-4o-mini" name="model" value="gpt-4o-mini">
            <label for="gpt-4o-mini">GPT 4 (Omni mini)</label><br>
            <input type="radio" id="gpt-4.1-nano" name="model" value="gpt-4.1-nano">
            <label for="gpt-4.1-mini">GPT 4.1 (nano)</label><br>
            <input type="radio" id="gpt-4.1-mini" name="model" value="gpt-4.1-mini">
            <label for="gpt-4.1-mini">GPT 4.1 (mini)</label><br>
        </fieldset>
        <input type="button" value="Submit" onclick="submitForm();">
    </form>
    
    <div class="spacer"></div>

    <form id="outputForm">
        <fieldset>
            <legend>LLM Output</legend>
            <textarea id="llm_output" rows="20" style="width:100%" readonly></textarea>
        </fieldset>
        <input type="button" value="Interpret" onclick="runInterpretation();">
    </form>
</body>
</html>
