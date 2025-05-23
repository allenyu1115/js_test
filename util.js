var deco = function () {
    Array.from(arguments).forEach(function (f) {
      typeof f === "function" &&
        Object.keys(f.prototype).forEach(function (key) {
          var objf = f.prototype[key];
          f.prototype[key] = function () {
            console.log("start invoke " + key);
            console.log(arguments);
            console.log(this);
            return objf.apply(this, arguments);
          };
        });
    });
  };
  
  
var bind = function (f, this_value) {
return function () {return f.apply (this_value, arguments)};
};


var jsclass = {methods: {
add_to: function (o) {
var t = this;
Object.keys (this.methods).each (function (k) {
o[k] = bind (t.methods[k], o); });
return o}}};
jsclass.methods.add_to.call (jsclass, jsclass);



var deco_func = function (obj, func, predict, extrafunc) {
  var originalFunc = obj[func];
  obj[func] = function () {
    if (
      (
        predict ||
        function () {
          return true;
        }
      )(arguments)
    ) {
      extrafunc && extrafunc(arguments);
      return originalFunc.apply(obj, arguments);
    }
  };
};


var isSameArrayObjs = (function () {
    var JSONstringifyOrder = function (obj) {
      var allKeys = new Set();
      JSON.stringify(obj, (key, value) => (allKeys.add(key), value));
      return JSON.stringify(obj, Array.from(allKeys).sort());
    };
    return function (a, b) {
      a = (a || []).map(JSONstringifyOrder);
      b = (b || []).map(JSONstringifyOrder);
      return (
        a.length === b.length &&
        a.every((e) => b.includes(e)) &&
        b.every((e) => a.includes(e))
      );
    };
  })();



var createActionHistory = (function () {
  var actionStatus = {
    Undoable: 1,
    Redoable: 2,
  };

  return function (initActionId) {
    var currentActionId = initActionId;
    var undoStack = [];
    var redoStack = [];

    var currentStatus = {
      undoable: false,
      redoable: false,
    };

    var refreshUndoRedo = function (extraAction) {
      currentStatus.undoable = undoStack.length > 0;
      currentStatus.redoable = redoStack.length > 0;
      typeof extraAction === "function" && extraAction(currentStatus.undoable, currentStatus.redoable);
    };

    return {
      undo: function () {
        if (undoStack.length > 0) {
          var lastAction = undoStack.pop();
          lastAction.undoFunc();
          lastAction.state = actionStatus.Redoable;
          redoStack.push(lastAction);
          refreshUndoRedo(lastAction.extraAction);
        }
      },

      redo: function () {
        if (redoStack.length > 0) {
          var redoAction = redoStack.pop();
          (redoAction.redoFunc || redoAction.actionFunc)();
          redoAction.state = actionStatus.Undoable;
          undoStack.push(redoAction);
          refreshUndoRedo(redoAction.extraAction);
        }
      },

      reset: function (extraAction) {
        undoStack.length = 0;
        redoStack.length = 0;
        currentActionId = initActionId;
        currentStatus.undoable = false;
        currentStatus.redoable = false;
        refreshUndoRedo(extraAction);
      },

      executeAction: function (extraAction, actionFunc, undoFunc, redoFunc) {
        actionFunc = actionFunc || function () {};
        actionFunc();
        currentActionId++;

        var newAction = {
          id: currentActionId,
          state: actionStatus.Undoable,
          actionFunc: actionFunc,
          undoFunc: undoFunc,
          redoFunc: redoFunc || actionFunc,
          extraAction: extraAction,
        };    
        undoStack.push(newAction);
        redoStack.length = 0; // Clear redoStack when a new action is executed
        refreshUndoRedo(extraAction);
      },
    };
  };
})();



async function getEpicsWithoutMasterConfig() {
    const JIRA_URL = "https://aspiraconnect.atlassian.net";
    const JIRA_USER = "test";
    const JIRA_API_TOKEN = "test";
    const authHeader = "Basic " + btoa(`${JIRA_USER}:${JIRA_API_TOKEN}`);

    let epicQuery = `${JIRA_URL}/rest/api/3/search?jql=issuetype=Epic AND "Scrum Team[Dropdown]" in (AO3,AO2) and sprint in openSprints() and project ="AWO Product Development"&fields=key,summary`;

    let response = await fetch(epicQuery, {
        method: "GET",
        headers: {
            "Authorization": authHeader,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        console.error("Error fetching Epics:", await response.text());
        return;
    }
    let epics = (await response.json()).issues;
    let epicsWithoutMasterConfig = [];
    for (let epic of epics) {
        let epicKey = epic.key;
        let childIssueQuery = `${JIRA_URL}/rest/api/3/search?jql="Epic Link"=${epicKey}&fields=issuetype,summary`;
        let childResponse = await fetch(childIssueQuery, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Accept": "application/json"
            }
        });
        if (!childResponse.ok) {
            console.error(`Error fetching child issues for ${epicKey}:`, await childResponse.text());
            continue;
        }
        let childIssues = (await childResponse.json()).issues || [];
        let hasMasterConfig = childIssues.some(issue => issue.fields.issuetype.name.includes("Master Config"));
        if (!hasMasterConfig) {
            epicsWithoutMasterConfig.push(epicKey);
        }
    }
    console.log("Epics without 'Master Config' child issues:", epicsWithoutMasterConfig);
}
getEpicsWithoutMasterConfig();


function MyPromise(executor) {
    this.state = "pending"; // pending, fulfilled, rejected
    this.value = undefined;
    this.handlers = [];

    const resolve = (value) => {
        if (this.state !== "pending") return;
        this.state = "fulfilled";
        this.value = value;

        // queue microtasks to run handlers
        queueMicrotask(() => {
            this.handlers.forEach(h => h(value));
        });
    };

    const reject = (reason) => {
        if (this.state !== "pending") return;
        this.state = "rejected";
        this.value = reason;
        // (you could also add error handlers)
    };

    try {
        executor(resolve, reject);
    } catch (err) {
        reject(err);
    }
}

MyPromise.prototype.then = function (onFulfilled) {
    return new MyPromise((resolve, reject) => {
        const wrapped = (value) => {
            try {
                const result = onFulfilled(value);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        };

        if (this.state === "fulfilled") {
            queueMicrotask(() => wrapped(this.value));
        } else {
            this.handlers.push(wrapped);
        }
    });
};


function myPromise(executor) {
    let onResolve;
    let onReject;

    const resolve = (value) => {
        // simulate microtask
        queueMicrotask(() => {
            if (onResolve) onResolve(value);
        });
    };

    const reject = (reason) => {
        queueMicrotask(() => {
            if (onReject) onReject(reason);
        });
    };

    const then = (callback) => {
        onResolve = callback;
        return { then };
    };

    const catchFn = (callback) => {
        onReject = callback;
        return { catch: catchFn };
    };

    executor(resolve, reject);

    return { then, catch: catchFn };
}

// === Usage ===
const p = myPromise((resolve, reject) => {
    console.log('Inside executor'); 
    resolve('Success!');
});

p.then(value => {
    console.log('Resolved with:', value);
}).catch(error => {
    console.log('Rejected with:', error);
});




