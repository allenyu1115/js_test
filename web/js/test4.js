

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
