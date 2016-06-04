var Promise = require('bluebird');

function report_location (req, res) {
    var loc = [parseFloat(req.query.long), parseFloat(req.query.lat)];
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    userQueryPromise.then(function(user) {
        var currentLocation = {
            loc: loc,
            time: new Date()
        };
        user.locations.push(currentLocation);
        user.lastLocation = currentLocation;
        return user.save()
    }).then(function() {
        return res.send("ok");
    }).catch(mongoose.Error.ValidationError, function(err) {
        return res.status(400).send(err.errors);
    }).catch(function(err) {
        return res.status(500).send(err);
    });
}

function get_nearby (req, res) {
    var usersQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    usersQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }

        return Promise.resolve(models.User.find({
            _id: {
                $ne: req.query.id
                // },
                // "lastLocation.loc": {
                //     $near: {
                //         $geometry: {
                //             type: "Point",
                //             coordinates: user.lastLocation.loc
                //         },
                //         $maxDistance: 111350
                //     }
            }
        }).exec());
    }).then(function(users) {
        if (req.query.onlyIds === "true") {
            var user_ids = [];
            users.forEach(function(user) {
                user_ids.push(user._id);
            });
            res.send(user_ids);
        } else {
            for (var i = 0; i < users.length; i++) {
                users[i].locations = []; // TODO: Remove locations from all user objects by default
            }
            res.send(users);
        }
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        }
        return res.status(500).send(err);
    });
}

module.exports = {
    report_location, get_nearby
};