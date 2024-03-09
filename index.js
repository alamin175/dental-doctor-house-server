const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// using middleware
app.use(express());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Doc house portal news coming");
});

app.listen(port, () => {
  console.log("listening port is", port);
});
