var Promise = require('bluebird');

function set_profileImg (req, res) {
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    userQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }
        user.profileImg = req.query.profileImg;
        return user.save();
    }).then(function(user) {
        return res.send(user);
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        }
        return res.status(500).send(err);
    });
}

function remove_friend (req, res) {
    var removerQueryPromise = models.User.findOne({
        "_id": req.query.from,
        "interactions.user_id": req.query.to
    }).exec();
    var removeeQueryPromise = models.User.findOne({
        "_id": req.query.to,
        "interactions.user_id": req.query.from
    }).exec();

    Promise.join(removerQueryPromise, removeeQueryPromise, function(remover, removee) {
        if (remover === null || removee === null) {
            throw "Bi-directional req-rec doesn't exists";
        }
    }).then(function() {
        return models.User.update({
            _id: req.query.from
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.to
                }
            }
        }).exec();
    }).then(function(user) {
        return models.User.update({
            _id: req.query.to
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.from
                }
            }
        }).exec();
    }).then(function() {
        return res.send("ok");
    }).catch(function(err) {
        if (err === "Bi-directional req-rec doesn't exists") {
            return res.status(400).send(err);
        }
        return res.status(400).send(err);
    });
}

function get_interactions(req, res) {
    var userQueryPromise = Promise.resolve(models.User.findById(req.query.id).exec());
    userQueryPromise.then(function(user) {
        if (user === null) {
            throw "User Does Not Exist";
        }
        return res.send(user.interactions);
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        }
        return res.status(500).send(err);
    });
}

function send_request (req, res) {
    userOnePromise = models.User.findById(req.query.from).exec();
    userTwoPromise = models.User.findById(req.query.to).exec();

    Promise.join(userOnePromise, userTwoPromise, function(user1, user2) {
        if (user1 === null || user2 === null) {
            throw "User Does Not Exist";
        }
    }).then(function() {
        var senderQueryPromise = models.User.findOne({
            "_id": req.query.from,
            "interactions.user_id": req.query.to
        }).exec();
        var receiverQueryPromise = models.User.findOne({
            "_id": req.query.to,
            "interactions.user_id": req.query.from
        }).exec();

        Promise.join(senderQueryPromise, receiverQueryPromise, function(sender, receiver) {
            if (sender !== null || receiver !== null) {
                throw "At least one interaction exists";
            }
        }).then(function() {
            var newInteraction = {
                user_id: req.query.to,
                isConnected: "req_sent",
                chat_id: [req.query.from, req.query.to].sort()
            }
            return models.User.findByIdAndUpdate(req.query.from, {
                $addToSet: {
                    interactions: newInteraction
                }
            }).exec();
        }).then(function() {
            var newInteraction = {
                user_id: req.query.from,
                isConnected: "req_received",
                chat_id: [req.query.from, req.query.to].sort()
            }
            return models.User.findByIdAndUpdate(req.query.to, {
                $addToSet: {
                    interactions: newInteraction
                }
            }).exec();
        }).then(function() {
            return res.send("ok");
        }).catch(function(err) {
            if (err === "At least one interaction exists") {
                //handleOneInteractionError()
            }
            return res.status(400).send(err);
        });
    }).catch(function(err) {
        if (err === "User Does Not Exist") {
            return res.status(404).send(err);
        } else {
            return res.status(400).send(err);
        }
    });
}

function accept_request (req, res) {
    var accepterQueryPromise = models.User.findOne({
        "_id": req.query.from,
        "interactions.user_id": req.query.to,
        "interactions.isConnected": "req_received"
    }).exec();
    var accepteeQueryPromise = models.User.findOne({
        "_id": req.query.to,
        "interactions.user_id": req.query.from,
        "interactions.isConnected": "req_sent"
    }).exec();

    Promise.join(accepterQueryPromise, accepteeQueryPromise, function(accepter, acceptee) {
        if (acceptee === null || acceptee === null) {
            throw "Bi-directional req-rec doesn't exists";
        }
    }).then(function() {
        return models.User.update({
            "_id": req.query.from,
            "interactions.user_id": req.query.to,
            "interactions.isConnected": "req_received"
        }, {
            "interactions.$.isConnected": "connected"
        }).exec();
    }).then(function() {
        return models.User.update({
            "_id": req.query.to,
            "interactions.user_id": req.query.from,
            "interactions.isConnected": "req_sent"
        }, {
            "interactions.$.isConnected": "connected"
        }).exec();
    }).then(function() {
        return res.send("ok");
    }).catch(function(err) {
        if (err === "Bi-directional req-rec doesn't exists") {
            return res.status(400).send(err);
        }
        return res.status(400).send(err);
    });
}

function decline_request (req, res) {
    var declinerQueryPromise = models.User.findOne({
        "_id": req.query.from,
        "interactions.user_id": req.query.to,
        "interactions.isConnected": "req_received"
    }).exec();
    var declineeQueryPromise = models.User.findOne({
        "_id": req.query.to,
        "interactions.user_id": req.query.from,
        "interactions.isConnected": "req_sent"
    }).exec();

    Promise.join(declinerQueryPromise, declineeQueryPromise, function(decliner, declinee) {
        if (decliner === null || declinee === null) {
            throw "Bi-directional req-rec doesn't exists";
        }
    }).then(function() {
        return models.User.update({
            _id: req.query.from
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.to
                }
            }
        }).exec();
    }).then(function(user) {
        return models.User.update({
            _id: req.query.to
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.from
                }
            }
        }).exec();
    }).then(function() {
        return res.send("ok");
    }).catch(function(err) {
        if (err === "Bi-directional req-rec doesn't exists") {
            return res.status(400).send(err);
        }
        return res.status(400).send(err);
    });
}

function cancel_request (req, res) {
    var cancellerQueryPromise = models.User.findOne({
        "_id": req.query.from,
        "interactions.user_id": req.query.to,
        "interactions.isConnected": "req_sent"
    }).exec();
    var cancelleeQueryPromise = models.User.findOne({
        "_id": req.query.to,
        "interactions.user_id": req.query.from,
        "interactions.isConnected": "req_received"
    }).exec();

    Promise.join(cancellerQueryPromise, cancelleeQueryPromise, function(canceller, cancellee) {
        if (canceller === null || cancellee === null) {
            throw "Bi-directional req-rec doesn't exists";
        }
    }).then(function() {
        return models.User.update({
            _id: req.query.from
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.to
                }
            }
        }).exec();
    }).then(function(user) {
        return models.User.update({
            _id: req.query.to
        }, {
            $pull: {
                interactions: {
                    user_id: req.query.from
                }
            }
        }).exec();
    }).then(function() {
        return res.send("ok");
    }).catch(function(err) {
        if (err === "Bi-directional req-rec doesn't exists") {
            return res.status(400).send(err);
        }
        return res.status(400).send(err);
    });
}


module.exports = {
    set_profileImg, remove_friend, get_interactions, send_request, accept_request, decline_request, cancel_request
};