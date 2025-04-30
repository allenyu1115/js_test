var users = ["Mars", "Allen", "Karl"];

var allWorkflows = [];

var workflowTemplate1 = {
  data: {
    text: "init",
    assignee: null,
    isDone: 'no'
  },
  steps:[
  function (myWorkflowData, obj) {
    myWorkflowData.text = obj;
  },
  function (myWorkflowData, obj) {
    myWorkflowData.assignee = obj;
  },
  function (myWorkflowData, obj) {
    myWorkflowData.isDone = obj;
  }
]};

var createWorkflowTemplate = function (workflowTemplate1, initiId) {
  var count = initiId;
  return {startNew: function () { 
    count = count + 1;
    var myWorkflowData = { ...workflowTemplate1.data };
    myWorkflowData.id = count;
    myWorkflowData.history =  "workflow id: " +myWorkflowData.id;
    
    var checkWorflowSatus = function (step) {
      return function (input) {
        if (!(myWorkflowData.isDone==='yes')) {
          step(input);
        } else {
          myWorkflowData.history = myWorkflowData.history + "-workflow has done";
        }
      };
    };
    var workflowSteps = [];  

    var myworkflowGnearted = {
      getHistory: function () {
        return myWorkflowData.history;
      },
      getId: function () {
        return myWorkflowData.id;
      },

      getWorkflowSteps(){
        return workflowSteps;
      }
    };
    var stepIndex = 0;
    for (var eachStep of workflowTemplate1.steps) {
      stepIndex = stepIndex + 1;
      var stepName = "step" + stepIndex;
      myworkflowGnearted[stepName] = checkWorflowSatus(function (obj) {
        eachStep(myWorkflowData, obj);
        myWorkflowData.history = myWorkflowData.history + "-" + "workflow changed:" + obj;
      });
    workflowSteps.push(stepName);      
    }
    return myworkflowGnearted;
  }};
};

var myWorkflow = createWorkflowTemplate(workflowTemplate1, 10000);

const createElement = (tag, id, textContent) => {
  const element = document.createElement(tag);
  element.id = id;
  element.className = id;
  element.textContent = textContent;
  return element;
};
// UI update function
const renderInitWorkflow = (workflow) => {

  // Helper function to create DOM elements
  function createDropDown(options, name) {
    var dropDown = createElement("select", name, name);
    for (let key in options) {
        let option = document.createElement("option");
        option.setAttribute("value", options[key]);
        let optionText = document.createTextNode(options[key]);
        option.appendChild(optionText);
        dropDown.appendChild(option);
    }
    return dropDown;
}
  const container = document.getElementById("workflow-container");
  const workflowContainer = createElement("div", "workflow-container" + workflow.getId());
  container.appendChild(workflowContainer);
  const historyInfo = createElement("div", "history", "workflow id: " + workflow.getId());
  workflowContainer.appendChild(historyInfo);
  const contentDiv = createElement("div", "workflow-content");
  workflowContainer.appendChild(contentDiv);


  [createElement("textarea", "step1_bindingcomp"+ '_' +  workflow.getId(), workflow.text ),
   createDropDown(users, "step2_bindingcomp"+ '_' +  workflow.getId()),createDropDown(['no','yes'], "step3_bindingcomp"+ '_' +  workflow.getId())].forEach(each=>
   contentDiv.appendChild(each)
  );

  
  // Create action button area
  const actionsDiv = createElement("div", "workflow-actions");
  workflowContainer.appendChild(actionsDiv);

 workflow.getWorkflowSteps().forEach((eachStep) => {
    var renderHistory = function (stepName) {
      return function () {
        workflow[stepName](document.getElementById(stepName + '_bindingcomp' + '_' +  workflow.getId()).value);
        historyInfo.textContent = workflow.getHistory();
      };
    };
    var eachButton = createElement("button", eachStep, eachStep);
    actionsDiv.appendChild(eachButton);
    eachButton.onclick = renderHistory(eachStep);
  });
};
// Initialize workflow when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  var generateButton = createElement("button", "generatenewworkflow", "generate new workflow");
  generateButton.onclick = function () {
    const aWorkflow = myWorkflow.startNew();
    allWorkflows.push(aWorkflow);
    renderInitWorkflow(aWorkflow);
  };
  container.appendChild(generateButton);
});