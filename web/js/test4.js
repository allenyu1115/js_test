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
        return currentIndex === -1
          ? null
          : actionHis[currentIndex].state === actionStatus.Undoable
          ? actionHis[currentIndex]
          : findUndoable(currentIndex - 1);
      },
      findRedoable = function (currentIndex) {
        return currentIndex === actionHis.length
          ? null
          : actionHis[currentIndex].state === actionStatus.Redoable
          ? actionHis[currentIndex]
          : findRedoable(currentIndex + 1);
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
            (currentHisStatus.redoable = redoableAction !== null));
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
          extraAction && refreshUndoRedo(extraAction);
      },

      executeAction: function (actionFunc, undoFunc, redoFunc, extraAction) {
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
          extraAction && refreshUndoRedo(extraAction);
      },
    };
  };
})();

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

console.log(isSameArrayObjs(null, null));
