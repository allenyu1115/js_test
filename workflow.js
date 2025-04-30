
    // 1. Core Workflow Template (logic only)
    const coreWorkflowTemplate1 = {
      data: {
        text: "init",
        assignee: null,
        isDone: 'no'
      },
      steps: [
        (data, input) => { data.text = input; },
        (data, input) => { data.assignee = input; },
        (data, input) => { data.isDone = input; }
      ]
    };

    // 2. UI Configuration for Each Step
    const users = ["Mars", "Allen", "Karl"];
    const uiConfig1 = [
      { input: "text" },
      { input: "dropdown", options: users },
      { input: "dropdown", options: ["no", "yes"] }
    ];

    // 3. Wrapper to Merge Core Template with UI Metadata
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

    // 4. Workflow Template Engine
    function createWorkflowTemplate(wrappedTemplate, initialId) {
      let count = initialId;
      return {
        startNew: function () {
          count++;
          const myWorkflowData = { ...wrappedTemplate.data };
          myWorkflowData.id = count;
          myWorkflowData.history = "workflow id: " + myWorkflowData.id;

          const checkWorkflowStatus = (step) => (input) => {
            if (myWorkflowData.isDone !== 'yes') {
              step(input);
            } else {
              myWorkflowData.history += "-workflow has done";
            }
          };

          const workflowSteps = [];
          const myWorkflowGenerated = {
            getHistory: () => myWorkflowData.history,
            getId: () => myWorkflowData.id,
            getWorkflowSteps: () => workflowSteps
          };

          wrappedTemplate.steps.forEach((stepObj, index) => {
            const stepName = "step" + (index + 1);
            workflowSteps.push({ stepName, input: stepObj.input, options: stepObj.options });

            myWorkflowGenerated[stepName] = checkWorkflowStatus((obj) => {
              stepObj.action(myWorkflowData, obj);
              myWorkflowData.history += "-workflow changed:" + obj;
            });
          });

          return myWorkflowGenerated;
        }
      };
    }

    // 5. DOM Utilities
    const createElement = (tag, id, textContent) => {
      const element = document.createElement(tag);
      element.id = id;
      element.className = id;
      if (textContent) element.textContent = textContent;
      return element;
    };

    function createDropDown(options, id) {
      const dropDown = createElement("select", id);
      options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        dropDown.appendChild(option);
      });
      return dropDown;
    }

    // 6. Render Workflow UI
    function renderInitWorkflow(workflow) {
      const container = document.getElementById("workflow-container");
      const workflowContainer = createElement("div", "workflow-container" + workflow.getId());
      container.appendChild(workflowContainer);

      const historyInfo = createElement("div", "history", workflow.getHistory());
      workflowContainer.appendChild(historyInfo);

      const contentDiv = createElement("div", "workflow-content");
      workflowContainer.appendChild(contentDiv);

      const actionsDiv = createElement("div", "workflow-actions");
      workflowContainer.appendChild(actionsDiv);

      workflow.getWorkflowSteps().forEach(({ stepName, input, options }) => {
        const inputId = `${stepName}_bindingcomp_${workflow.getId()}`;
        let inputEl;

        if (input === "dropdown") {
          inputEl = createDropDown(options, inputId);
        } else {
          inputEl = createElement("input", inputId);
        }

        contentDiv.appendChild(inputEl);

        const button = createElement("button", stepName, stepName);
        button.onclick = () => {
          const value = document.getElementById(inputId).value;
          workflow[stepName](value);
          historyInfo.textContent = workflow.getHistory();
        };
        actionsDiv.appendChild(button);
      });
    }

    // 7. App Initialization
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("root");
      const generateButton = createElement("button", "generatenewworkflow", "Generate New Workflow");

      const wrappedTemplate = wrapCoreTemplate(coreWorkflowTemplate1, uiConfig1);
      const workflowEngine = createWorkflowTemplate(wrappedTemplate, 10000);

      generateButton.onclick = () => {
        const aWorkflow = workflowEngine.startNew();
        renderInitWorkflow(aWorkflow);
      };

      container.appendChild(generateButton);
    });
  