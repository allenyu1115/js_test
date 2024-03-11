$().ready(function () {
  (function () {
    function calculator() {
      function cal(left, right) {
        return left + right;
      }
      return {
        left: 0,
        right: 0,
        result() {
          return cal(this.left, this.right);
        },
      };
    }
    function calculator2() {
      var x = 0;
      var y = 0;
      var z = cal(x, y);
      function cal(left, right) {
        return left + right;
      }
      return {
        left: x,
        setleft(outx) {
          x = outx;
        },
        right: y,
        setright(outy) {
          y = outy;
        },
        result() {
          return z;
        },
        refresh() {
          z = cal(x, y);
          return z;
        },
      };
    }

    var cal_instance = calculator();
    cal_instance.left = 1;
    cal_instance.right = 2;
    $("#app").append("<div>" + cal_instance.result() + "</div>");

    var cal_instance2 = calculator2();
    cal_instance2.setleft(777);
    cal_instance2.setright(888);
    $("#app").append("<div>" + cal_instance2.refresh() + "</div>");
    $("#app").append("<div>" + cal_instance2.result() + "</div>");
  })();
});
