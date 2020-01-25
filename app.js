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

var roadmap =
`## Roadmap

### Commands
- [x] Show Completed
- [x] Show To-Do
- [x] Add
- [ ] Remove
- [x] Update
- [ ] Help
- [ ] Info
- [x] Complete

### Extras
* Ability to use in other servers
* Remove completed tasks after a certain amount of time
* Separate tasks into pages if it gets too long
* Separate lists by desired categories (e.g. coding, factorio, etc.)

## Authors
* Sammy Chang
* Joseph Kwon
* Joshua Lee`

var taskId;

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        args = args.slice(1);
        switch(cmd) {
            
            // !help
            case "help":
            
                var display_Command_List = ["!add ","!complete ", "!completed ", "!info ", "!list ", "!ping "];

                bot.sendMessage({
                    to: channelID,
                    embed: {
                        title: "Help: Commands",
                        color: 11027200,
                        description: display_Command_List.toString()
                    }
                });

            break;

            // !info
            case "info":
                bot.sendMessage({
                    to: channelID,

                    embed: {

                        title: "To-Do-List Bot",
                        url: "https://github.com/jlee755/to-do-list-bot",
                        description: "To-Do List Bot is a " +
                                     "Discord bot that performs " +
                                     "simple functions to " +
                                     "add, update, and remove tasks.\n\n" +
                                     "Type \!help for a command list on the full " +
                                     "features of To-Do List Bot.\n\n" +

                                     "```md\n" +
                                     roadmap + "\n" +
                                     "```",
                        footer: {
                            text: "v0.1.0"
                        }
                                // Create an actual info. This is filler text
                    }
                });
            break;

            // !list
            case "list":
                // Wanted to order by ID number before using arbitrary index values for user to call.
                // Find all tasks where the task isn't yet completed.
                var sqlQuery = "SELECT id,task " +
                               "FROM to_do_list " +
                               "WHERE completed=false " +
                               "ORDER BY id ASC";
                db.query(sqlQuery, function (err, result, fields) {

                    if (err) throw new Error(err);

                    var newResult = result.map(function(obj,ind) {

                        // Converting the object to one that can be placed into 'fields' easily.
                        obj.name = "Task #" + (ind+1);
                        obj.value = obj.task;

                        // Removing the objects that we don't want in 'fields'.
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
                            // This URL is so long...
                            thumbnail: {
                                url: "https://media1.giphy.com/"+
                                     "media/wBf9D9itRvhgA/giphy.gif?"+
                                     "cid=790b76110a92c3bce45df86c0b5b8698e35875e01553b106&rid=giphy.gif"
                            },
                            fields: newResult
                        }
                    });
                });
            break;

            // !completed
            case 'completed':
                // SQL query that finds all rows where completed is true (i.e. the task is completed).
                var sqlQuery = "SELECT id,task,completed_at " +
                               "FROM to_do_list " +
                               "WHERE completed=true " +
                               "ORDER BY id ASC";
                db.query(sqlQuery, function (err, result, fields) {
                    if (err) throw new Error(err);

                    var newResult = result.map(function(obj,ind) {

                        // Pretty formatting of the returned query.
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

                    // Escaping characters to prevent SQL injections
                    var sqlQuery = "INSERT INTO to_do_list(task) VALUES (?)";
                    db.query(sqlQuery, taskAdded, function(err, result) {
                        if (err) throw new Error(err);
                    });

                    bot.sendMessage({
                        to: channelID,
                        message: user + " has added \"" + addedItem.join(" ") + "\" to the to-do list"          
                    });

                } else {
                    // Can't have a blank task.
                    bot.sendMessage({
                        to: channelID,
                        message: "You can not add nothing to the list!"
                    });
                }
            break;

            // !complete
            case "complete":

                taskId = args[0];

                // Make sure taskId is a number
                if (!isNaN(taskId)) {
                    logger.info("Trying to mark " + taskId + " completed.");

                    // Probably going to have to make multiple queries since we need to
                    // determine what the ID of the task is. Unless we keep an ongoing
                    // memory of the mapping in the Node application... Not sure what
                    // the best implementation is here.

                    var sqlQuery = "SELECT id,task," +
                                   "ROW_NUMBER() OVER (ORDER BY id ASC) " +
                                   "FROM to_do_list " +
                                   "WHERE completed=false " +
                                   "ORDER BY id ASC";

                    db.query(sqlQuery, function(err,result) {
                        if (err) throw new Error(err);

                        if (result[taskId-1]) {
                            let taskField = result[taskId-1].task;
                            taskId = result[taskId-1].id.toString();

                            var sqlQuery = "UPDATE to_do_list SET completed = true WHERE id = ?";
                            db.query(sqlQuery,[taskId], function(err,result) {
                                if (err) throw new Error(err);

                                // There was an ID match but no change to the completed column,
                                // meaning that it's already marked complete.
                                // This might not be an issue once task IDs are taken out entirely
                                // from the user's view.
                                if (result.affectedRows && !result.changedRows) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Task \"" + taskField + "\" already complete."
                                    });
                                // There was an ID match and a successful update to the completed
                                // column.
                                } else if (result.affectedRows && result.changedRows) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Marked task \"" + taskField + "\" complete."
                                    });
                                // There was no ID match.
                                } else {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Not a proper task number."
                                    });
                                };
                            });
                        } else {
                            bot.sendMessage({
                                to: channelID,
                                message: "This task number is not on the list!"
                            });
                        };
                    });
                // If it's not a number, return message.
                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: "You must provide a proper task #."
                    });
                }
            break;

            // !update
            case "update":

                taskId = args[0];
                args = args.slice(1);

                // Make sure taskID is a number
                if (!isNaN(taskId)) {
                    // Make sure there's a new task to update with
                    if (args.length) {
                        let arg_as_string = args.join(" ");
                        var sqlQuery = "UPDATE to_do_list SET task = ?, completed = false, completed_at = NULL WHERE id = ?";
                        db.query(sqlQuery,[arg_as_string, taskId],function(err,result) {
                            if (err) throw new Error(err);

                            if (result.affectedRows && !result.changedRows) {
                                // Task name didn't change and is not complete.
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Nothing to update."
                                });
                            } else if (result.affectedRows && result.changedRows) {
                                // New task name. Update successful.
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Updated task " + taskId + " to " + arg_as_string
                                });
                            } else {
                                // No matching task ID.
                                bot.sendMessage({
                                    to: channelID,
                                    message: "No task with ID " + taskId + "."
                                });
                            };

                        });
                    } else {
                        // args was blank
                        bot.sendMessage({
                            to: channelID,
                            message: "No new task given."
                        });
                    }
                } else {
                    // Not a proper task ID
                    bot.sendMessage({
                        to: channelID,
                        message: taskId + " is not a valid task ID."
                    });
                };
            break;
            // Just add any case commands if you want to..
        }
    }
});
