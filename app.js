//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connecting to mongoDB and creating new DB todolistDB
mongoose.connect("mongodb+srv://admin-misha:test123@cluster0.3uins.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Creating a chema and a model for schema for out to do items
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

//Creating 3 default todo items and an array to save there our default items.
const item1 = new Item({
  name: "Welcome to your todolist !",
});

const item2 = new Item({
  name: "Hit the + button to add new item.",
});

const item3 = new Item({
  name: "<--- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

//Creating an array for different lists
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

//GET functions +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) console.log(err);
        else console.log("Inserted default items successfully!");
      });
      res.redirect("/");
    } else res.render("list", { listTitle: "Today", newListItems: foundItems });
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

//POST functions ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function (err) {
      if (err) console.log(err);
      else console.log("Deleted successfully!");
      res.redirect("/");
    });
    
  } else {
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id: checkedItem}}},function (err, foundList) { 
      if(!err) res.redirect("/"+ listName);
     });
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Listen to port 3000 function +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
