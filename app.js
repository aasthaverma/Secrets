//jshint esversion:6

require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine","ejs");

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;
db.once("open",function(){
  console.log("DB Connected");
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password : String,
  googleId : String,
  facebookId : String,
  secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function (req,res){
  res.render("home");
});

app.get("/register",function (req,res){
  res.render("register");
});

app.get("/login",function (req,res){
  res.render("login");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  });

app.get("/auth/facebook",
  passport.authenticate('facebook'));

app.get("/auth/facebook/secrets",
  passport.authenticate('facebook', { failureRedirect: "/login" }),
    function(req, res) {
      res.redirect("/secrets");
  });


app.get("/secrets",function (req,res){
  User.find({secret :{ $ne: null }},function(err,foundUser){
    if(err){
      res.send(err);
    }
    else{
      if(foundUser){
        res.render("secrets",{userWithSecret : foundUser});
      }
    }
  })
});

app.get("/submit",function (req,res){
  if(req.isAuthenticated())
  {
    res.render("submit");
  }
  else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function (req,res){
  User.register({username:req.body.username}, req.body.password , function(err, user) {
  if (err) {
    console.log(err);
    res.redirect("/register");
  }
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
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
        res.redirect("/secrets");
      });
    }
});
});

app.post("/submit",function (req,res){
  User.findById(req.user._id,function(err,foundUser){
    if(err)
    {
      res.send(err);
    }
    else{
      if(foundUser){
        foundUser.secret = req.body.secret;
        foundUser.save(function(err){
          if(err){
            res.send(err);
          }else{
            res.redirect("/secrets");
          }
        });
      }
    }
  })
});

app.listen("3000",function(){
  console.log("Server started at port:3000");
});
