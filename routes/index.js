var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");

let storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "upload/");
  },
  filename: function (req, file, callback) {
    let extension = path.extname(file.originalname);
    let basename = path.basename(file.originalname, extension);
    callback(null, basename + "-" + Date.now() + extension);
  },
});

let upload = multer({
  storage: storage,
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "IMAGE UPLOAD"
  });
});

router.post("/upload", upload.single("imagFile"), (req, res) => {
  var radioChecked = Object.entries(req.body);
  if (radioChecked[0][1] == "ben") {
    res.redirect("/processing/" + req.file.filename);
  } else if (radioChecked[0][1] == "rice") {
    res.redirect("/processing1/" + req.file.filename);
  }
});

module.exports = router;