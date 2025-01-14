// Utility function to convert str to title case
function toTitleCase(str) {
  return str
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
    .join(" ");
}

$(() => {
  // Get URL pathname;
  const path = window.location.pathname;
  const directoryToFetch = path === "/" ? "" : path;

  // Fetch folder's content with directory in body
  fetch("/contents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      directory: directoryToFetch,
    }),
  })
    .then((response) => response.json())
    .then((items) => {
      console.log(items);
      // Add each folder item as a list item
      items.forEach((item) => {
        // URL = current location + new item's path
        const url =
          window.location.href +
          (window.location.href.slice(-1) === "/" ? "" : "/") +
          item.name.toLowerCase().replaceAll(" ", "%20");

        // Different formatting if it is a folder/file
        if (!item.isFile) {
          $(".contents ul").append(`<li><a href=${url}>${item.name}</a></li>`);
        } else {
          const title = item.name.match(
            /(?<=\d{4}-\d{2}-\d{2}-)(.*)(?=.txt|.html)/g
          )[0];
          $(".contents ul").append(
            `<li><a href=${url}>${toTitleCase(
              title.replaceAll("-", " ")
            )}</a></li>`
          );
          $(".contents ul").append(
            `<sub>${item.summary ?? "No Summary"}</sub>`
          );
        }
      });
    });
});
