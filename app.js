//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { Schema } = mongoose;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);

mongoose.connect('mongodb+srv://addYourOwnSRVLinkHere', { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Click + to add a task to the list."
});

const item2 = new Item({
  name: "<--- Check the box to remove an item."
});

const item3 = new Item({
  name: "add a / to end of web address and type a string to be taken to that address(i.e: /groceries)"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (error, tasks) => {
    if(tasks.length === 0) {
      Item.insertMany(defaultItems, (error) => {
        if(error) {
          console.log(error);
        } else {
          console.log("Successfully added data.")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: tasks});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addItem = new Item({
    name: itemName
  });

  if(listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(addItem);
      foundList.save();
      res.redirect(`/${listName}`)
    })
  }
});

app.post("/delete", (req, res, next) => {
  const completedTask = req.body.itemToDelete;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(completedTask, (err) => {
      if(!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: completedTask}}}, (err, foundList) => {
      if(!err) {
        res.redirect(`/${listName}`);
      }
    })
  }  
});

app.get("/:urlParam", function(req,res){
  const dashParameter = _.capitalize(req.params.urlParam);

  List.findOne({ name: dashParameter }, (error, foundList) => {
    if(!error) {
      if(!foundList) {
        const list = new List ({
          name: dashParameter,
          items: defaultItems
        });
        list.save();
        res.redirect(`/${dashParameter}`);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }  
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
