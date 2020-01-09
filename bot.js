var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

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

                let addedCommand = args[0];

                if(typeof addedCommand === 'string'){

                    // Set bool completed to 0 indicating the task is not done
                    // Store addedCommand into a sql database so that tasks aren't lost on restart

                    bot.sendMessage({
                        to: channelID,
                        message: user + " has added " + addedCommand + " to the to-do list"          
                    });
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
