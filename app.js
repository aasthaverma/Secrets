//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine','ejs');

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.once("open",function(){
  console.log("DB Connected");
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password : String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function (req,res){
  res.render("home");
});

app.get("/register",function (req,res){
  res.render("register");
});

app.get("/login",function (req,res){
  res.render("login");
});

app.get("/secret",function (req,res){
  if(req.isAuthenticated())
  {
    res.render("secrets");
  }
  else {
    res.redirect('/login');
  }

});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.post("/register",function (req,res){
  User.register({username:req.body.username}, req.body.password , function(err, user) {
  if (err) {
    console.log(err);
    res.redirect('/register');
  }
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect('/secret');
    });
  }
});
});

app.post("/login",function(req,res){
  const user =new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    }else {
      passport.authenticate("local")(req,res,function(){
        res.redirect('/secret');
      });
    }
});
});

app.listen("3000",function(){
  console.log("Server started at port:3000");
});
