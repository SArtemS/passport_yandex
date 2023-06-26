const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

app.use(session({ secret: "supersecret", resave: true, saveUninitialized: true }));

let Users = [{'login': 'admin', 'email': 'spider3333@yandex.ru'},
            {'login': 'SArtemS', 'email': 'spiderr3333@gmail.com'}];

const findUserByLogin = (login) => {
    return Users.find((element) => {
        return element.login == login;
    })
}     

const findUserByEmail = (email) => {
    return Users.find((element) => {
        return element.email.toLowerCase() == email.toLowerCase();
    })
} 

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
});

passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
        done(null, user);
});

passport.use(new YandexStrategy({
    clientID: 'CLIENT_ID',
    clientSecret: 'CLIENT_SECRET',
    callbackURL: "http://localhost:8081/auth/yandex/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);
    user.profile = {'gender': profile.gender, 'UserName': profile.displayName};
    if (user == undefined) return done(true, null);
    
    done(null, user);
  }
));

passport.use(new GitHubStrategy({
    clientID: 'CLIENT_ID',
    clientSecret: 'CLIENT_SECRET',
    callbackURL: "http://localhost:8081/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    let user = findUserByLogin(profile.username);
    user.profile = {'id': profile.id, 'UserName': profile.username, 'Profile Url': profile.profileUrl};
    if (user == undefined) return done(true, null);
    
    done(null, user);
  }
));


const isAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res) => {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', { failureRedirect: '/login', successRedirect: '/private'}) );

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.get('/auth/github', passport.authenticate('github', { scope: [ 'user:email' ] }));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login', successRedirect: '/private'}) );

app.listen(port, () => console.log(`App listening on port ${port}!`))