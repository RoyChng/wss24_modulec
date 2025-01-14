$(() => {
  const path = window.location.pathname;

  // Get directory to fetch
  const directoryToFetch = path === "/" ? "" : path;

  // Fetch contents of page
  fetch("/content", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      directory: directoryToFetch,
    }),
  })
    .then((response) => response.json())
    .then((content) => {
      // Display date
      $("#date").text("Date: " + content.date);

      // Display title
      $("h1").text(content.title);

      // Display tags
      if (content.tags) {
        content.tags.forEach((tag) => {
          $("#tags").append(` <a href="/tags/${tag}">${tag}</a>`);
        });
      } else {
        $("#tags").empty();
      }

      // Display draft status
      $("#draft").text("Draft: " + (content.draft ? "true" : "false"));

      // Display main content as HTML
      $(".contents").html(content.mainContent);

      // If more than 100 characters, display drop cap
      if (content.mainContent.length > 100)
        $("style").append(`
            p:first-child::first-letter {
            float: left;
            font-size: 75px;
            line-height: 60px;
            padding: 4px 8px 0 3px;
          }
          `);

      // Display header img
      if (content.cover) {
        $(".header-img").attr(
          "src",
          "http://localhost:8000/images/" + content.cover
        );
      } else {
        $("h1").css("margin-top", "50px");
      }

      // Setup image enlarge handler
      $(".content-img").on("click", function (e) {
        $(".backdrop img").attr("src", $(e.currentTarget).attr("src"));
        $(".backdrop").css("display", "flex");
      });
    });

  // Close backdrop when cicked
  $(".backdrop").on("click", function () {
    $(".backdrop").css("display", "none");
  });

  $(".header-img").mousemove(function (e) {
    // values: e.clientX, e.clientY, e.pageX, e.pageY
    const { clientX, clientY } = e;
    console.log(clientX, clientY);
    $("#spotlight").css(
      "background",
      `radial-gradient(circle at ${clientX}px ${clientY}px, rgba(255,255,255,0) 10px, #000000ee 300px)`
    );
  });
});
