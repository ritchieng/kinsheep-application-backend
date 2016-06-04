var Promise = require('bluebird');

function get_chat(req, res) {
    var chatQueryPromise = Promise.resolve(models.Chat.findOne({
        "chat_id": [req.query.from, req.query.to].sort()
    }).exec());

    chatQueryPromise.then(function(chat) {
        if (chat === null) {
            throw "Chat Does Not Exists";
        }
        res.send(chat)
    }).catch(function(err) {
        if (err === "Chat Does Not Exists") {
            return res.status(404).send(err);
        }
        res.status(500).send(err);
    })
}

function create_message(req, res) {
    var chatQueryPromise = Promise.resolve(models.Chat.findOne({
        "chat_id": [req.query.from, req.query.to].sort()
    }).exec());

    chatQueryPromise.then(function(chat) {
        var newMessage = createMessage(req.query.msg, req.query.from, req.query.to);
        if (chat === null) {
            return models.Chat.create({
                "chat_id": [req.query.from, req.query.to].sort(),
                messages: [newMessage]
            });
        }
        chat.messages.addToSet(newMessage);
        return chat.save();
    }).then(function() {
        return res.send("ok");
    }).catch(mongoose.Error.ValidationError, function(err) {
        return res.status(400).send(err.errors)
    }).catch(function(err) {
        return res.status(500).send(err);
    });
}

module.exports = {
    get_chat, create_message
};