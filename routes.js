const express = require("express");
const path = require("path");
const fsPromises = require("node:fs/promises");
const fs = require("fs");

const router = express.Router();
const contentFolderPath = "./content-pages";

router.get("/", (req, res) => {
  res.sendFile("layout/list-page.html", { root: __dirname });
});

router.get("/search", (req, res) => {
  res.sendFile("layout/search-page.html", { root: __dirname });
});

router.get("/tags/:tag", (req, res) => {
  res.sendFile("layout/tag-search-page.html", { root: __dirname });
});

// API Endpoint: Returns a folders content
router.post("/contents", (req, res) => {
  const directory =
    contentFolderPath + (decodeURIComponent(req.body.directory) ?? "");
  let allContents = fs.readdirSync(directory);

  allContents = allContents.map((fileName) => {
    const fileStats = fs.statSync(path.join(directory, fileName));

    let summary;

    // If it is a file, get summary
    if (fileStats.isFile()) {
      const fileContent = fs
        .readFileSync(path.join(directory, fileName))
        .toString();

      summary = fileContent.match(/(?<=summary:).*/)?.at(0);
    }

    return { name: fileName, isFile: fileStats.isFile(), summary };
  });

  res.json(allContents);
});

// API Endpoint: Returns a file content
router.post("/content", async function (req, res) {
  const filePath = contentFolderPath + decodeURIComponent(req.body.directory);
  const content = (await fsPromises.readFile(filePath)).toString();

  // Get date in file path
  const date = filePath.match(/\d{4}-\d{2}-\d{2}/g)[0];

  // Get front matter string and split into array of every line
  const frontMatter = content
    .match(/(?<=---\n)(.*)(?=\n---)/gs)[0]
    ?.split("\n");

  // Get main content (after front matter)
  let mainContent = content.match(/(?<=---\n\n)(.*)/gs)[0];

  const isHTML = filePath.includes(".html");

  // Find title, tags, summary, cover and draft status from front matter
  let title, tags, cover, isDraft, summary;

  frontMatter?.forEach((data) => {
    if (data.includes("title")) title = data.split("title: ")[1];
    if (data.includes("tags")) tags = data.split("tags: ")[1];
    if (data.includes("summary")) summary = data.split("summary: ")[1];
    if (data.includes("cover")) cover = data.split("cover: ")[1];
    if (data.includes("draft")) isDraft = data.split("draft: ")[1];
  });

  // If title is not found in front matter
  if (!title) {
    // Use title in first h1 tag
    const h1Match = mainContent.match(/(?<=<h1>)(.*)(?=<\/h1>)/g);
    if (h1Match) title = h1Match[0];
    // Else, find it in file path and transform it through title case
    else
      title = filePath
        .match(/(?<=\d{4}-\d{2}-\d{2}-)(.*)(?=.txt|.html)/g)
        .split("-")
        .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
        .join(" ");
  }

  if (!isHTML) {
    // If not HTML, need to transform the content
    mainContent = mainContent.split("\n").map((data) => {
      if (data.trim() === "") return data;
      if (data.includes(".jpg") || data.includes(".jpeg"))
        return `<img class='content-img' src='http://localhost:8000/images/${data}' />`;
      return `<p>${data}</p>`;
    });

    // Split main content with new lines and convert to HTML
    mainContent = mainContent
      .join("\n")
      .replaceAll(" **", " <b>")
      .replaceAll("**", "</b>")
      .replaceAll("*", "<li>");
  }
  return res.json({
    date,
    title,
    tags: tags?.split(",").map((t) => t.trim()),
    summary,
    cover,
    isDraft,
    mainContent,
  });
});

// API Endpoint: Search for files
router.post("/search", async function (req, res) {
  // Change '/' to '|' to be able to use regex to search multiple values
  const searchQuery = req.body.query.replaceAll("/", "|");

  let allFiles = await fsPromises.readdir(contentFolderPath, {
    recursive: true,
  });

  allFiles = allFiles.filter((fileName) => {
    // Not including folders in search results
    if (!fileName.includes(".txt") && !fileName.includes(".html")) return false;

    // Get file's content
    const file = fs.readFileSync("./content-pages/" + fileName);
    const fileContent = file.toString();

    // If title in front matter && contains query, add to results
    const queryInTitle = fileContent.match(/(?<=title:).*/g);
    if (queryInTitle && queryInTitle[0].match(new RegExp(searchQuery, "gi")))
      return true;

    // If filename in URL, add to results
    if (
      fileName
        .match(/(?<=\d{4}-\d{2}-\d{2}-)(.*)(?=.txt|.html)/g)
        ?.at(0)
        ?.split("-")
        ?.join(" ")
        ?.match(new RegExp(searchQuery, "gi"))
    )
      return true;

    // Use regex to retrieve only main content (don't want front matter)
    const mainContent = fileContent.match(/(?<=---\n\s)(.*)/gs);

    if (!mainContent) return false;

    // If main content contains query, add to result
    return mainContent[0].match(new RegExp(searchQuery, "gi"));
  });

  // Get summary (can be improved/more optimal if done above)
  allFiles = allFiles.map((url) => {
    const fileContent = fs.readFileSync("./content-pages/" + url).toString();
    const summary = fileContent.match(/(?<=summary:).*/)?.at(0);
    return {
      url,
      summary,
    };
  });

  res.json(allFiles);
});

// API Endpoint: Search for tag
router.post("/tags", async function (req, res) {
  const tagToFind = req.body.tagQuery;

  let allFiles = await fsPromises.readdir(contentFolderPath, {
    recursive: true,
  });

  allFiles = allFiles.filter((fileName) => {
    // Not including folders in search results
    if (!fileName.includes(".txt") && !fileName.includes(".html")) return false;

    const file = fs.readFileSync("./content-pages/" + fileName);
    const fileContent = file.toString();

    const tagsInFile = fileContent.match(/(?<=tags:).*/g);

    return (
      tagsInFile &&
      tagsInFile[0]
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .includes(tagToFind.toLowerCase())
    );
  });

  // Get summary (can be improved/more optimal if done above)
  allFiles = allFiles.map((url) => {
    const fileContent = fs.readFileSync("./content-pages/" + url).toString();
    const summary = fileContent.match(/(?<=summary:).*/)?.at(0);
    return {
      url,
      summary,
    };
  });

  res.json(allFiles);
});

router.use(function (req, res, next) {
  // Check if text/html file
  const url = req.url;
  const isFile = url.includes(".");

  if (isFile) {
    // If yes, return single page layout
    res.sendFile("layout/layout-single-page.html", { root: __dirname });
  } else {
    // Else return layout for displaying folder's content
    res.sendFile("layout/list-page.html", { root: __dirname });
  }
});

module.exports = router;
