// Utility function to convert str to title case
function toTitleCase(str) {
  return str
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ");
}

$(() => {
  // Get query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const query = queryParams.get("query");

  $(".search__box input:first-child").val(query);

  // Fetch folder's content with directory in body
  fetch("/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
    }),
  })
    .then((response) => response.json())
    .then((relativeURLS) => {
      console.log(relativeURLS);
      // Display number of results
      $("h3").text(`${relativeURLS.length} Results for "${query}"`);

      // Add each folder item as a list item
      relativeURLS.forEach(({ url: relativeURL, summary }) => {
        // URL = current location + new item's path
        const absoluteURL = "http://localhost:8000/" + relativeURL;

        // Retrieve title using regex
        const title = relativeURL.match(
          /(?<=\d{4}-\d{2}-\d{2}-)(.*)(?=.txt|.html)/g
        )[0];

        $(".contents ul").append(
          `<li><a href=${absoluteURL.replaceAll(" ", "%20")}>${toTitleCase(
            title.replaceAll("-", " ")
          )}</a></li><sub>${summary ?? "No Summary"}</sub>`
        );
      });
    });
});
