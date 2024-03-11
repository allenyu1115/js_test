var deco = function () {
  Array.from(arguments).forEach(function (f) {
    typeof f === "function" &&
      Object.keys(f.prototype).forEach(function (key) {
        var objf = f.prototype[key];
        f.prototype[key] = function () {
          console.log("start invoke " + key);
          console.log(arguments);
          console.log(this);
          var rs = objf.apply(this, arguments);
          console.log("end invoke " + key);
          return rs;
        };
      });
  });
};
