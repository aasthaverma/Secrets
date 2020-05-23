//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true});

const db = mongoose.connection;
db.once("open",function(){
  console.log("DB Connected");
});

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine','ejs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password : String
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User",userSchema);

app.get("/",function (req,res){
  res.render("home");
});

app.get("/register",function (req,res){
  res.render("register");
});

app.get("/login",function (req,res){
  res.render("login");
});

app.post("/register",function (req,res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if(err){
      res.send(err);
    }
    else{
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  const email= req.body.username;
  const password= req.body.password;
  User.findOne({ email: email},function(err,foundUser){
    if(err){
      res.send(err);
    }
    else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});

app.listen("3000",function(){
  console.log("Server started at port:3000");
});
