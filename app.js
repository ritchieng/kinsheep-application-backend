var express = require('express');
var app = express();
var fs = require('fs');
var https = require('https');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var models = require('./models');
var Promise = require('bluebird');
var users = require('./user');
var chats = require('./chat');
var services = require('./service');
var misc = require('./misc');

var NodeCache = require('node-cache');
app.loginSessions = new NodeCache();

mongoose.connect('mongodb://localhost/kinsheep');

var server = https.createServer({
    key: fs.readFileSync('kinsheep.com.key'),
    cert: fs.readFileSync('www_kinsheep_com.crt')
}, app);

function requireHTTPS(req, res, next) {
    if (!req.secure) {
        //FYI this should work for local development as well
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

app.use(requireHTTPS);

app.use(bodyParser.json({
    limit: '512kb'
}));

app.get('/login', services.login);

app.get('/exists', services.exists);

app.get('/get_profile', services.get_profile);

app.get('/set_profileImg', users.set_profileImg);

app.get('/send_request', users.send_request);

app.get('/accept_request', users.accept_request);

app.get('/decline_request', users.decline_request);

app.get('/cancel_request', users.cancel_request);

app.get('/remove_friend', users.remove_friend);

app.get('/report_location', misc.report_location);

app.get('/get_nearby', misc.get_nearby);

app.get('/get_interactions', users.get_interactions);

app.get('/add_user', services.add_user);

app.post('/edit_user', services.edit_user);

app.get('/remove_user', services.remove_user);

app.get('/get_chat', chats.get_chat);

app.get('/create_message',chats.create_message);

app.get('/friends', function(req, res) {
    var usersPromise = Promise.resolve(models.User.find({}).exec());
    usersPromise.then(function(users) {
        for (var i = 0; i < users.length; i++) {
            users[i].locations = []; // TODO: Remove locations from all user objects by default
        }
        res.send(users);
    }).catch(function(err) {
        return res.status(500).send(err);
    });
});

function createUser(query) {
    return new models.User({
        firstName: query.firstName,
        lastName: query.lastName,
        position: query.position,
        firm: query.firm,
        profileImg: query.profileImg,
        email: query.email,
        password: query.password,
        pitch: query.pitch,
        publicLinks: {
            twitter: query.twitter,
            facebook: query.facebook,
            github: query.github,
            linkedIN: query.linkedIN
        }
    });
}

function createMessage(msg, from, to) {
    return {
        time: new Date(),
        from: from,
        to: to,
        body: msg
    };
}

server.listen(3030);