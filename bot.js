/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit, using the Dialogflow middleware.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Get a developer access token from dialogflow
    -> https://console.dialogflow.com/api-client/#/editAgent/<your-agent-id>
  Run your bot from the command line:
    dialogflow=<api-token> token=<token> node example_bot.js
# USE THE BOT:
  Train an intent titled "hello-intent" inside Dialogflow.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the dialogflow console!
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

if (!process.env.dialogflow) {
    console.log('Error: Specify dialogflow in environment');
    process.exit(1);
}

var Botkit = require('botkit');

var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    //redirectUri: 'https://doraemon-bot.glitch.me/oauth',
    //json_file_store: __dirname + '/.data/db/',
    debug: true,
    scopes: ['bot'],
};


var slackController = Botkit.slackbot(bot_options);

slackController.startTicking();

var webserver = require(__dirname + '/components/express_webserver.js')(slackController);
//slackController.setupWebserver(webserver);

var slackBot = slackController.spawn({
    token: process.env.token,
});

var dialogflowMiddleware = require('botkit-middleware-dialogflow')({
    token: process.env.dialogflow,
});

slackController.middleware.receive.use(dialogflowMiddleware.receive);
slackBot.startRTM();

slackController.hears(['works-of-artist'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  
  // TAKE ARTIST FROM DIALOGFLOW
  var artist = message.entities.any;
  
  // PREPARE THE QUERY
  // var base = "http://data.doremus.org/sparql?default-graph-uri=&query="
  // var querytext = "SELECT DISTINCT ?title WHERE { ?expression a efrbroo:F22_Self-Contained_Expression ; rdfs:label ?title . ?expCreation efrbroo:R17_created ?expression ; ecrm:P9_consists_of / ecrm:P14_carried_out_by ?composer . ?composer foaf:name \"" + artist + "\"} ORDER BY ?title LIMIT 10"
  // var query = base + encodeURI(querytext)
  
  /*
  // CSV VERSION
  var csvQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle%0D%0AWHERE+%7B%0D%0A++%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B+%0D%0A++++rdfs%3Alabel+%3Ftitle+.+%0D%0A++%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B+%0D%0A++ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.%0D%0A++%3Fcomposer+foaf%3Aname+%22Ludwig+van+Beethoven%22%0D%0A%7D%0D%0AORDER+BY+%3Ftitle+LIMIT+10&format=text%2Fcsv&timeout=0&debug=on"
  const request = require('request');
  request(csvQuery, (err, res, body) => {
    
    if (err) { return console.log(err); }
    
    bot.reply(message, body);
  });
  */
  
  // JSON VERSION
  var jsonQuery = "http://data.doremus.org/sparql?default-graph-uri=&query=SELECT+DISTINCT+%3Ftitle+WHERE+%7B+%3Fexpression+a+efrbroo%3AF22_Self-Contained_Expression+%3B+rdfs%3Alabel+%3Ftitle+.+%3FexpCreation+efrbroo%3AR17_created+%3Fexpression+%3B+ecrm%3AP9_consists_of+%2F+ecrm%3AP14_carried_out_by+%3Fcomposer+.+%3Fcomposer+foaf%3Aname+%22" + artist.replace(" ", "+") + "%22+%7D+LIMIT+10%0D%0A&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on"
  const request = require('request');
  request(jsonQuery, (err, res, body) => {
    
    if (err) { return console.log(err); }
    
    // JSON PARSING
    console.log(body)
    var json = JSON.parse(body)
    
    // RESPONSE
    var resp = "Sure! This is the list:\n";
    json["results"]["bindings"].forEach(function(row) {
      resp += ("  >  " + row["title"]["value"] + "\n");
    });
    bot.reply(message, resp);
  });
});

/*
slackController.hears(['weather'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  console.log("***************");
  console.log(message.entities);
  console.log("----")
  console.log(message.fulfillment.displayText)
  console.log(message.nlpResponse)
  if (message.fulfillment.displayText)
    bot.reply(message, message.fulfillment.displayText);
});
*/

slackController.hears(['hello-intent'], 'direct_message, direct_mention, mention', dialogflowMiddleware.hears, function(bot, message) {
  bot.reply(message, "Hi there! I'm a classical music expert");
});


// Set up an Express-powered webserver to expose oauth and webhook endpoints
// var webserver = require(__dirname + '/components/express_webserver.js')(slackController);

/*
if (process.env.clientId && process.env.clientSecret) {
  webserver.get('/', function(req, res){
    res.render('index', {
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })
  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + '/components/user_registration.js')(slackController);

  // Send an onboarding message when a new team joins
  require(__dirname + '/components/onboarding.js')(slackController);

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(slackController);

  // enable advanced botkit studio metrics
  require('botkit-studio-metrics')(slackController);

  var normalizedPath = require("path").join(__dirname, "skills");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    require("./skills/" + file)(slackController);
  }); 
} else {
  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + '/components/plugin_glitch.js')(slackController);

  webserver.get('/', function(req, res){
    res.render('installation', {
      studio_enabled: slackController.config.studio_token ? true : false,
      domain: req.get('host'),
      protocol: req.protocol,
      glitch_domain:  process.env.PROJECT_DOMAIN,
      layout: 'layouts/default'
    });
  })

  var where_its_at = 'https://' + process.env.PROJECT_DOMAIN + '.glitch.me/';
  console.log('WARNING: This application is not fully configured to work with Slack. Please see instructions at ' + where_its_at);
}
*/