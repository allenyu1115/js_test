$().ready(function () {
  (function () {
    $('#selectGrp > input[type="radio"] ').click(function (myevent) {
      $("#bindGrp > div").each(function (_index, value) {
        $("#" + value.id)[
          value.id === myevent.target.id + "Bind" ? "show" : "hide"
        ]();
      });
    });
  })();
});
