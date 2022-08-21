//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const passportLocal = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose")
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
// set up the express-session

app.use(session({
    secret: 'my name is Steno Nicolas',
    resave: false,
    saveUninitialized: false,

}));
// initialize passport and combine it with session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/mySecretAppDb"); //create secret Database
//create secret Schema
const secretSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret:[String]
});
//set up the passportLocalMongoose
secretSchema.plugin(passportLocalMongoose);
secretSchema.plugin(findOrCreate);
//configure passportLocalMongoose
const Secret = new mongoose.model("Secret", secretSchema);
passport.use(Secret.createStrategy());
/*
passport.serializeUser(Secret.serializeUser());
passport.deserializeUser(Secret.deserializeUser());
*/
passport.serializeUser(function(user, done){
    done(null, user.id)
});
passport.deserializeUser(function(id, done){
    Secret.findById(id, function(err, user){
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret:process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/StenoSteno"

    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        Secret.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));
//home route
app.get("/", (req, res) => {
    res.render("home")
});
//submit route
app.get("/submit", (req, res) => {
    res.render("submit")
});
// auth/google
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile"]
    }) //for pop up
);
//google authentication
app.get('/auth/google/StenoSteno', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
  //get route for submit
  app.get("/submit", function (req, res) {
      if(req.isAuthenticated){
res.redirect("/submit")
      }else{
        res.render("/login");
      }
      
    })


//logout route
app.get('/logout', function (req, res, ) {
    req.logout(function (err) {
        if (err) {
            return (err);
        }
        res.redirect('/');
    });
});
/*
app.get("/logout", function(req, res, next){
    req.logout(function(err){
        if(err){
            return next(err);}
            res.redirect("/")
        
    })
})
*/

app.get("/secrets", function (req, res) {
    Secret.find({"secret":{$ne:null}}, function(err, foundUser){
if(err){
    console.log(err)
}else{
    if(foundUser){
res.render("secrets", {userWithSecrets:foundUser})
    }
}
    })

})


app.get("/login", (req, res) => {
    res.render("login")
})
app.get("/register", (req, res) => {
    res.render("register")
})
//post route for register
app.post("/register", (req, res) => {
    Secret.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })

        }
    })


})
//login post route
app.post("/login", function (req, res) {
    const user = new Secret({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })
});
//post route for submitted secrets
app.post("/submit", (req, res)=>{
const secretCode=req.body.secret;
//find current user and save the secret into their file
console.log(req.user);//passport has saved it already
console.log(req.user.id);
Secret.findById(req.user.id, function(err, foundUser){
if(err){
    console.log(err)
}else{
    if(foundUser){
    foundUser.secret=secretCode;
    foundUser.save(function(){
        res.redirect("/secrets")
    })    
    }
}
})
})


app.listen(3000, function (req, res) {
    console.log("server is listening to port 3000")
})