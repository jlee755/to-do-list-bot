var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var db = require('./database');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.slice(1);
        switch(cmd) {
            
            // !info
            case "info":
                bot.sendMessage({
                    to: channelID,

                    embed: {

                        title: "Info aobut To-Do-List Bot",
                        url: "https://github.com/jlee755/to-do-list-bot",
                        description: "To-Do-List Bot info: \n" +
                                     "Version: " + "lol jk" + "\n" +
                                     "This bot does this and that"
                                // Create an actual info. This is filler text
                    }
                });
            break;

            // !list
            case "list":
                var sqlQuery = "SELECT id,task " +
                               "FROM to_do_list " +
                               "WHERE completed=false " +
                               "ORDER BY id ASC";
                db.query(sqlQuery, function (err, result, fields) {

                    if (err) throw new Error(err);

                    var newResult = result.map(function(obj) {

                        obj.name = "Task ID: " + obj.id;
                        obj.value = obj.task;

                        delete obj.id;
                        delete obj.task;
                        delete obj.completed;
                        return obj;

                    });

                    bot.sendMessage({
                        to: channelID,
                        embed: {
                            title: "Task List",
                            color: 11027200,
                            thumbnail: {
                                url: "https://media1.giphy.com/media/wBf9D9itRvhgA/giphy.gif?cid=790b76110a92c3bce45df86c0b5b8698e35875e01553b106&rid=giphy.gif"
                            },
                            fields: newResult
                        }
                    });
                });
            break;

            // !completed
            case 'completed':
                var sqlQuery = "SELECT id,task,completed_at " +
                               "FROM to_do_list " +
                               "WHERE completed=true " +
                               "ORDER BY id ASC";
                db.query(sqlQuery, function (err, result, fields) {
                    if (err) throw new Error(err);

                    var newResult = result.map(function(obj,ind) {

                        obj.name = (ind+1)+
                                   " - Completed on "+
                                   obj.completed_at.toLocaleString()+" Eastern.";
                        obj.value = obj.task;
                        delete obj.id;
                        delete obj.task;
                        delete obj.completed_at;
                        return obj;

                    });

                    bot.sendMessage({
                        to: channelID,
                        embed: {
                            title: "Completed Tasks",
                            color: 11027200,
                            fields: newResult
                        }
                    });
                });

            break;

            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });

            break;
            
            // !add
            case "add":

                let addedItem = args;

                if(Array.isArray(addedItem) && addedItem.every(function(i){ return typeof i === "string" })){

                    var taskAdded = addedItem.join(" ");

                    // Create and set bool completed to 0 indicating the task is not done
                    // Store addedItem into a sql database so that tasks aren't lost on restart
                    var sqlQuery = "INSERT INTO to_do_list(task) VALUES (?)";
                    db.query(sqlQuery, taskAdded, function(err, result) {
                        if (err) throw new Error(err);
                    });

                    // bool completed = 0

                    bot.sendMessage({
                        to: channelID,
                        message: user + " has added " + addedItem.join(" ") + " to the to-do list"          
                    });

                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: "You can not add nothing to the list!"
                    });
                }
            break;

            // !complete
            case "complete":

                let taskId = args[0];

                if (!isNaN(taskId)) {
                    logger.info("Trying to mark " + taskId + " completed.");
                    var sqlQuery = "UPDATE to_do_list SET completed = true WHERE id = ?";
                    db.query(sqlQuery,[taskId], function(err,result) {
                        if (err) throw new Error(err);

                        if (result.affectedRows && !result.changedRows) {
                            bot.sendMessage({
                                to: channelID,
                                message: "Task #" + taskId + " already complete."
                            });
                        } else if (result.affectedRows && result.changedRows) {
                            bot.sendMessage({
                                to: channelID,
                                message: "Marked task #" +
                                    taskId +
                                    " complete.\nDo we want to use task name instead?"
                            });
                        } else {
                            bot.sendMessage({
                                to: channelID,
                                message: "No task with ID " + taskId + "."
                            });
                        };
                    });
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: taskId + " is not a valid task ID."
                    });
                }
            break;

            // Just add any case commands if you want to..
        }
    }
});
