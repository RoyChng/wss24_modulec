const express = require("express");
const routes = require("./routes");
const app = express();
const port = 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
app.use(express.json());

app.use(express.static("public"));
app.use("/", routes);
