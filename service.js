var Promise = require('bluebird');

function login (req, res) {
    var userQueryPromise = Promise.resolve(models.User.findOne({
        email: req.query.email,
        password: req.query.password
    }).exec());

    userQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }
        var sessionId = Math.floor(Math.random() * 100000);
        var timeoutVal = 2 * 24 * 3600; // 2 days in seconds
        req.app.loginSessions.set(sessionId, user._id, timeoutVal);
        user.sessionId = sessionId;
        return res.send(user);
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            res.status(404).send(err);
        }
        res.status(500).send(err);
    });
}

function exists (req, res) {
    userOnePromise = models.User.findById(req.query.from).exec();
    userTwoPromise = models.User.findById(req.query.to).exec();

    Promise.join(userOnePromise, userTwoPromise, function(user1, user2) {
        return res.send([user1, user2]);
    }).catch(function(err) {
        return res.status(400).send(err);
    });
}

function get_profile(req, res) {
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    userQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }
        user.locations = []; // Hack to reduce user data size. TODO: Separate out locations into separate db table/model
        return res.send(user);
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        }
        return res.status(500).send(err);
    });
}

function add_user (req, res) {
    var userQueryPromise = Promise.resolve(models.User.findOne({
        email: req.query.email
    }).exec());

    userQueryPromise.then(function(user) {
        if (user !== null) {
            throw "User Exists";
        }
        var user = createUser(req.query);
        return user.save();
    }).then(userQueryPromise).then(function(user) {
        return res.send(user);
    }).catch(function(err) {
        if (err === "User Exists") {
            return res.status(400).send(err);
        }
        return res.status(500).send(err);
    });
}

function edit_user (req, res) {
    // var sessionId = req.app.loginSessions.get(req.body.sessionId);
    // if (sessionId !== req.query.id) {
    //     return res.status(400).send("Invalid session");
    // }
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());

    userQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }
        user.firstName = req.body.firstName ? req.body.firstName : user.firstName;
        user.lastName = req.body.lastName ? req.body.lastName : user.lastName;
        user.email = req.body.email ? req.body.email : user.email;
        user.password = req.body.password ? req.body.password : user.password;
        user.pitch = req.body.pitch ? req.body.pitch : user.pitch;
        user.position = req.body.position ? req.body.position : user.position;
        user.firm = req.body.firm ? req.body.firm : user.firm;
        user.profileImg = req.body.profileImg ? req.body.profileImg : user.profileImg;
        return user.save();
    }).then(function() {
        return res.send("ok");
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        }
        return res.status(500).send(err);
    });
}

function remove_user (req, res) {
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    userQueryPromise.then(function() {
        res.send("ok");
    }).catch(function(err) {
        return res.status(500).send("Unable to delete user.");
    });
}

module.exports = {
    login, exists, get_profile, add_user, edit_user, remove_user
};