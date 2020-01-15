var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var mysql = require('mysql');

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

/*var con = mysql.createConnection({
    host: "HOST",
    user: "USERNAME",
    password: "PASSWORD",
    databse: "DATABASE"
})*/

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
                    message: "To-Do-List Bot info: \n" +
                             "Version: " + "lol jk" + "\n" +
                             "This bot does this and that"
                             // Create an actual info. This is filler text
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

                if(typeof addedItem === 'string'){

                    //if(Check that addedItem is not already in sql databse) {

                        // bool completed = 0; Store in sql
                        // string? toSql = addedItem; Store in sql

                        /*con.connect(function(err){

                            if(err) throw err;
                            console.log("Connected");
                        
                            var sql = "INSERT INTO to-do-list (user, task, completed) VALUES (username, toSql, completed)";

                            con.query(sql, function(err, result) {
                                if(err) throw err;
                                console.log("1 log inserted")
                            });
                        
                        });*/

                        bot.sendMessage({
                            to: channelID,
                            message: user + " has added " + addedItem + " to the to-do list"          
                        });

                    /*} else {
                        bot.sendMessage({
                            to: channelID,
                            message: "That already exists in the to-do list!"
                        })
                    }*/

                } else {
                    bot.sendMessage({
                        to: channelID,
                        message: "You can not add nothing to the list!"
                    });
                }
            break;
            // Just add any case commands if you want to..
        }
    }
});
