// Utility function to convert str to title case
function toTitleCase(str) {
  return str
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ");
}

$(() => {
  // Get tag searched for
  const tagQuery = window.location.pathname.split("/").at(-1);

  $("h1").text(`Tag Results (${tagQuery})`);

  // Fetch folder's content with directory in body
  fetch("/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tagQuery,
    }),
  })
    .then((response) => response.json())
    .then((relativeURLS) => {
      // Add each folder item as a list item
      relativeURLS.forEach(({ url: relativeURL, summary }) => {
        // URL = current location + new item's path
        const absoluteURL = "http://localhost:8000/" + relativeURL;

        // Retrieve title using regex
        const title = relativeURL
          .match(/(?<=\d{4}-\d{2}-\d{2}-)(.*)(?=.txt|.html)/g)
          ?.at(0);

        if (!title) return;
        $(".contents ul").append(
          `<li><a href=${absoluteURL.replaceAll(" ", "%20")}>${toTitleCase(
            title.replaceAll("-", " ")
          )}</a></li><sub>${summary ?? "No Summary"}</sub>`
        );
      });
    });
});
