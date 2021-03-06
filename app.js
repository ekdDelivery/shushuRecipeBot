/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var emoji = require('node-emoji');
var SearchLibrary = require('./SearchDialogLibrary');
var AzureSearch = require('./SearchProviders/azure-search');

// Azure Search
var azureSearchClient = AzureSearch.create('shushu-recipes','EB01DC42455D1FA8FE0414741526E05B','videorecipesindex');
var ResultsMapper = SearchLibrary.defaultResultsMapper(ToSearchHit);


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector,
    function(session) {
        session.send(`Hi I am Shushu ${emoji.get('smile')}, \n\nI can help you find Ghanaian recipes`);
        session.beginDialog('dishSearch');
    }
);

bot.library(SearchLibrary.create({
    multipleSelectiion: true,
    search: function (query) { return azureSearchClient.search(query).then(ResultsMapper);}
}));

bot.dialog('dishSearch', [
    function(session){
        // Trigger Azure Search dialogs
        SearchLibrary.begin(session);
    },
    function (session, args) {
        // Process selected search results
        session.send(`Goodbye ${emoji.get('wave') + emoji.get('wave')}, \n\nJust say hi to start again ${emoji.get('smile')}`,args.selection.map(function (i) { return i.key; }).join(', ')); //format your response
    }
]);

function ToSearchHit(azureResponse) {
    return {
        // define your own parameters
        key: azureResponse.Id,
        title: azureResponse.Dish,
        video_url: azureResponse.Video_Url,
        source: azureResponse.Source
    };
}


