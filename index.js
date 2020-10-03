const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const validUrl = require("valid-url");
const ejs = require("ejs");
const path = require("path");
const shortid = require("shortid");
const app = express();
const { Url } = require("./models/url");

app.use(express.json({ extented: true }));

//bodyParser
app.use(bodyParser.urlencoded({ extended: true }));

//===============db======================
mongoose
  .connect("mongodb://localhost/url-shortener-api", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

//========================================

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;

//BaseUrl
const BaseUrl = "https://url-shortener-app1.herokuapp.com";

//=========Routes======================

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/", async (req, res) => {
  const longUrl = req.body.url;
  const msgs = [];
  const errors = [];
  const urlCode = shortid.generate();

  if (validUrl.isUri(longUrl)) {
    const user = await Url.findOne({ longUrl });

    if (user) {
      //console.log(user)
      msgs.push(user);
      res.render("index.ejs", { msgs });
    } else {
      const shortUrl = BaseUrl + "/" + urlCode;

      const newUrl = new Url({
        urlCode,
        longUrl,
        shortUrl,
        date: new Date(),
      });

      await newUrl.save().then(() => {
        console.log("Url saved in db");
        msgs.push(newUrl);
        res.render("index.ejs", { msgs });
      });
    }
  } else {
    console.log("Enter valid Url");
    errors.push({ error: "Enter an Valid Url. Try Again Later ." });
    res.render("index.ejs", { errors });
    console.log(errors.error);
  }
});

app.get("/:code", async (req, res) => {
  try {
    const userUrl = await Url.findOne({ urlCode: req.params.code });
    console.log(userUrl);
    if (userUrl) {
      return res.redirect(userUrl.longUrl);
    } else {
      throw new Error("This URL wasn't found on the server!");
    }
  } catch (e) {
    console.log(e.message);
    res.render("index", { errors: [{ error: e.message }] });
  }
});

app.listen(port, () => {
  console.log("Server listening on port " + port);
});
