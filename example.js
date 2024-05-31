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


var decofun = function(obj,func){
     obj[func] = function(){     	    
        return obj.__proto__[func].call(obj,arguments);      
     }
}
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



var createActionHistory = function (initActionId) {
  var undoAction = [];
  var redoAction = [];
  var currentActionId = initActionId;
  var currentStatus = {
    undoable: false,
    redoable: false,
  };
  var refreshUndoRedo = function (extraAction) {
    extraAction(currentStatus.undoable, currentStatus.redoable);
  };
  return {
    undo: function () {
      var first = undoAction.pop();
      first && first.undoFunc();
      undoAction.length === 0 && (currentStatus.undoable = false);
      if (first) {
        redoAction.push(first);
        currentStatus.redoable = true;
        first.extraAction(currentStatus.undoable, currentStatus.redoable);
      }
    },
    redo: function () {
      var redoFirst = redoAction.pop();
      redoFirst && redoFirst.redoFunc();
      redoAction.length === 0 && (currentStatus.redoable = false);
      if (redoFirst) {
        undoAction.push(redoFirst);
        currentStatus.undoable = true;
        redoFirst.extraAction(currentStatus.undoable, currentStatus.redoable);
      }
    },

    reset: function (extraAction) {
      undoAction.length = 0;
      redoAction.length = 0;
      currentStatus.undoable = false;
      currentStatus.redoable = false;
      refreshUndoRedo(extraAction);
    },

    executeAction: function (extraAction, actionFunc, undoFunc, redoFunc) {
      actionFunc = actionFunc || function () {};
      actionFunc();
      currentActionId = currentActionId + 1;
      undoAction.push({
        actionId: currentActionId,
        undoFunc: undoFunc,
        redoFunc: redoFunc || actionFunc,
        extraAction: extraAction,
      });
      currentStatus.undoable = true;
      refreshUndoRedo(extraAction);
    },
  };
};

var createActionHistory = (function () {
  var actionStatus = {
    Undoable: 1,
    Redoable: 2,
  };
  return function (initActionId) {
    var actionHis = [],
      currentHisStatus = {
        undoable: false,
        redoable: false,
      },
      currentAction = null,
      undoableAction = null,
      redoableAction = null,
      currentActionId = initActionId,
      findUndoable = function (currentIndex) {
        while (currentIndex >= 0) {
          if (actionHis[currentIndex].state === actionStatus.Undoable) {
            return actionHis[currentIndex];
          }
          currentIndex--;
        }
        return null;
      },
      findRedoable = function (currentIndex) {
        while (currentIndex < actionHis.length) {
          if (actionHis[currentIndex].state === actionStatus.Redoable) {
            return actionHis[currentIndex];
          }
          currentIndex++;
        }
        return null;
      },
      refreshUndoRedo = function (extraAction) {
        var currentActionIndex;
        currentAction === null
          ? ((currentHisStatus.undoable = false),
            (currentHisStatus.redoable = false),
            (undoableAction = null),
            (redoableAction = null))
          : ((currentActionIndex = actionHis.indexOf(currentAction)),
            (undoableAction = findUndoable(currentActionIndex)),
            (redoableAction = findRedoable(currentActionIndex)),
            (currentHisStatus.undoable = undoableAction !== null),
            (currentHisStatus.redoable = redoableAction !== null)),
          typeof extraAction === "function" &&
            extraAction(currentHisStatus.undoable, currentHisStatus.redoable);
      };
    return {
      undo: function () {
        undoableAction && undoableAction.action();
      },
      redo: function () {
        redoableAction && redoableAction.action();
      },

      reset: function (extraAction) {
        (currentActionId = initActionId),
          (actionHis.length = 0),
          (currentAction = null),
          (currentHisStatus = {
            undoable: false,
            redoable: false,
          }),
          refreshUndoRedo(extraAction);
      },

      executeAction: function (extraAction, actionFunc, undoFunc, redoFunc) {
        actionFunc = actionFunc || function () {};
        actionFunc(),
          (currentActionId = currentActionId + 1),
          actionHis.push({
            id: currentActionId,
            state: actionStatus.Undoable,
            action: function () {
              this.state === actionStatus.Undoable
                ? (undoFunc(), (this.state = actionStatus.Redoable))
                : ((redoFunc || actionFunc)(),
                  (this.state = actionStatus.Undoable)),
                (currentAction = this),
                refreshUndoRedo(extraAction);
            },
          }),
          (currentAction = actionHis[actionHis.length - 1]),
          refreshUndoRedo(extraAction);
      },
    };
  };
})();


