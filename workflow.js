
    // 1. Core Workflow Template (logic only, now CPS-style)
    const coreWorkflowTemplate1 = {
      data: {
        text: "init",
        assignee: null,
        isDone: 'no'
      },
      steps: [
        (data, input, cont) => { data.text = input; cont(); },
        (data, input, cont) => { data.assignee = input; cont(); },
        (data, input, cont) => { data.isDone = input; cont(); }
      ]
    };

    // 2. UI Configuration for Each Step
    const users = ["Mars", "Allen", "Karl"];
    const uiConfig1 = [
      { input: "text" },
      { input: "dropdown", options: users },
      { input: "dropdown", options: ["no", "yes"] }
    ];

    // 3. Merge Core Logic with UI Metadata
    function wrapCoreTemplate(coreTemplate, uiConfig) {
      return {
        data: { ...coreTemplate.data },
        steps: coreTemplate.steps.map((action, index) => {
          const config = uiConfig[index] || {};
          return {
            action,
            input: config.input || "text",
            options: config.options || []
          };
        })
      };
    }

    // 4. CPS-Based Workflow Template Engine
    function createWorkflowTemplate(wrappedTemplate, initialId) {
      let count = initialId;
      return {
        startNew: function () {
          count++;
          const myWorkflowData = { ...wrappedTemplate.data };
          myWorkflowData.id = count;
          myWorkflowData.history = "workflow id: " + myWorkflowData.id;

          const myWorkflowGenerated = {
            getId: () => myWorkflowData.id,
            getHistory: () => myWorkflowData.history,
            getWorkflowData: () => myWorkflowData,
            runStep: function (index, input, cont) {
              if (myWorkflowData.isDone === 'yes') {
                myWorkflowData.history += "-workflow has done";
                cont();
                return;
              }
              const step = wrappedTemplate.steps[index];
              step.action(myWorkflowData, input, () => {
                myWorkflowData.history += "-workflow changed:" + input;
                cont();
              });
            },
            getStepConfig: (index) => wrappedTemplate.steps[index],
            getTotalSteps: () => wrappedTemplate.steps.length
          };

          return myWorkflowGenerated;
        }
      };
    }

    // 5. DOM Utilities
    const createElement = (tag, id, textContent) => {
      const el = document.createElement(tag);
      el.id = id;
      if (textContent) el.textContent = textContent;
      return el;
    };

    function createDropDown(options, id) {
      const select = createElement("select", id);
      options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      return select;
    }

    // 6. Render Step-by-Step UI with CPS Navigation
    function renderWorkflow(workflow) {
      const container = document.getElementById("workflow-container");
      const wfContainer = createElement("div", "workflow-" + workflow.getId());
      container.appendChild(wfContainer);

      const historyEl = createElement("div", "history", workflow.getHistory());
      wfContainer.appendChild(historyEl);

      const stepDiv = createElement("div", "step-content");
      wfContainer.appendChild(stepDiv);

      const navDiv = createElement("div", "workflow-actions");
      wfContainer.appendChild(navDiv);

      let currentStep = 0;
      const totalSteps = workflow.getTotalSteps();
      const inputState = [];

      function renderStep() {
        stepDiv.innerHTML = '';
        navDiv.innerHTML = '';

        const stepConfig = workflow.getStepConfig(currentStep);
        const inputId = `input-step-${currentStep}`;
        let inputEl;

        if (stepConfig.input === "dropdown") {
          inputEl = createDropDown(stepConfig.options, inputId);
        } else {
          inputEl = createElement("input", inputId);
        }

        inputEl.className = "workflow-step";
        if (inputState[currentStep]) inputEl.value = inputState[currentStep];

        stepDiv.appendChild(inputEl);

        const backBtn = createElement("button", "back-btn", "Back");
        backBtn.disabled = currentStep === 0;
        backBtn.onclick = () => {
          currentStep--;
          renderStep();
        };

        const nextBtn = createElement("button", "next-btn", currentStep === totalSteps - 1 ? "Finish" : "Next");
        nextBtn.onclick = () => {
          const val = document.getElementById(inputId).value;
          inputState[currentStep] = val;

          workflow.runStep(currentStep, val, () => {
            historyEl.textContent = workflow.getHistory();
            if (currentStep < totalSteps - 1) {
              currentStep++;
              renderStep();
            } else {
              nextBtn.disabled = true;
            }
          });
        };

        navDiv.appendChild(backBtn);
        navDiv.appendChild(nextBtn);
      }

      renderStep();
    }

    // 7. App Initialization
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("root");
      const generateBtn = createElement("button", "generate-btn", "Generate New Workflow");
      container.appendChild(generateBtn);

      const wrapped = wrapCoreTemplate(coreWorkflowTemplate1, uiConfig1);
      const engine = createWorkflowTemplate(wrapped, 1000);

      generateBtn.onclick = () => {
        const wf = engine.startNew();
        renderWorkflow(wf);
      };
    });
  