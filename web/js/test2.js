$().ready(function () {
  (function () {
    var show_added = true;
    let init_line = "Here is show more";
    let added_line = "<br>add new content";

    $("#show").click(function () {
      $("#mydefault").html(show_added ? init_line : init_line + added_line);
      $("#show").html(show_added ? "show all" : "show less");
      $("#mydefault").css(
        show_added
          ? { height: "1.5em", overflow: "hidden" }
          : {
              height: "3em",
              overflow: "auto",
            }
      );
      show_added = !show_added;
    });
    $("#show").trigger("click");
  })();
});
