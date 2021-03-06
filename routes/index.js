var request = require('request');
var cors = require('cors');
var uuid = require('uuid');

// This is the heart of your HipChat Connect add-on. For more information,
// take a look at https://developer.atlassian.com/hipchat/guide
module.exports = function (app, addon) {
  var hipchat = require('../lib/hipchat')(addon);

  // simple healthcheck
  app.get('/healthcheck', function (req, res) {
    res.send('OK');
  });

  // Root route. This route will serve the `addon.json` unless a homepage URL is
  // specified in `addon.json`.
  app.get('/',
    function(req, res) {
      // Use content-type negotiation to choose the best way to respond
      res.format({
        // If the request content-type is text-html, it will decide which to serve up
        'text/html': function () {
          res.redirect(addon.descriptor.links.homepage);
        },
        // This logic is here to make sure that the `addon.json` is always
        // served up when requested by the host
        'application/json': function () {
          res.redirect('/atlassian-connect.json');
        }
      });
    }
  );

  // This is an example route that's used by the default for the configuration page
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/configuration-page
  app.get('/config',
    // Authenticates the request using the JWT token in the request
    addon.authenticate(),
    function(req, res) {
      // The `addon.authenticate()` middleware populates the following:
      // * req.clientInfo: useful information about the add-on client such as the
      //   clientKey, oauth info, and HipChat account info
      // * req.context: contains the context data accompanying the request like
      //   the roomId
      res.render('config', req.context);
    }
  );

  // This is an example glance that shows in the sidebar
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/glances
  app.get('/glance',
    cors(),
    addon.authenticate(),
    function(req, res) {
      res.json({
        "label": {
          "type": "html",
          "value": "Hello World!"
        },
        "status": {
          "type": "lozenge",
          "value": {
            "label": "Broken",
            "type": "error"
          }
        }
      });
    }
  );

  // This is an example end-point that you can POST to to update the glance info
  // Room update API: https://www.hipchat.com/docs/apiv2/method/room_addon_ui_update
  // Group update API: https://www.hipchat.com/docs/apiv2/method/addon_ui_update
  // User update API: https://www.hipchat.com/docs/apiv2/method/user_addon_ui_update
  app.post('/update_glance',
    cors(),
    addon.authenticate(),
    function(req, res){
      res.json({
        "label": {
          "type": "html",
          "value": "Hello World!"
        },
        "status": {
          "type": "lozenge",
          "value": {
            "label": "All good",
            "type": "success"
          }
        }
      });
    }
  );

  // This is an example sidebar controller that can be launched when clicking on the glance.
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/views/sidebar
  app.get('/sidebar',
    addon.authenticate(),
    function(req, res) {
      res.render('sidebar', {
        identity: req.identity
      });
    }
  );

  // This is an example dialog controller that can be launched when clicking on the glance.
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/views/dialog
  app.get('/dialog',
    addon.authenticate(),
    function(req, res) {
      res.render('dialog', {
        identity: req.identity
      });
    }
  );

  // Sample endpoint to send a card notification back into the chat room
  // https://www.hipchat.com/docs/apiv2/method/send_room_notification.
  // For more information on Cards, take a look at:
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/cards
  app.post('/send_notification',
    addon.authenticate(),
    function (req, res) {
      var card = {
        "style": "link",
        "url": "https://www.hipchat.com",
        "id": uuid.v4(),
        "title": "El HipChat!",
        "description": "Great teams use HipChat: Group and private chat, file sharing, and integrations",
        "icon": {
          "url": "https://hipchat-public-m5.atlassian.com/assets/img/hipchat/bookmark-icons/favicon-192x192.png"
        }
      };
      var msg = '<b>' + card.title + '</b>: ' + card.description;
      var opts = {'options': {'color': 'yellow'}};
      hipchat.sendMessage(req.clientInfo, req.identity.roomId, msg, opts, card);
      res.json({status: "ok"});
    }
  );

  // This is an example route to handle an incoming webhook
  // https://developer.atlassian.com/hipchat/guide/webhooks
  app.post('/webhook',
    addon.authenticate(),
    function (req, res) {
      var command = req.body.item.message.message;
      // // var api_key = "<your api key from weather underground>";
      // var html = "";
      // var options = {};
      // command = parseCommand(command);
      // if (command.command.trim().toLowerCase() === 'map') {
      //   html = "<img src='http://api.wunderground.com/api/" + api_key + "/animatedradar/q/" + command.state + "/" + command.city + ".gif?width=280&height=280&newmaps=1'><br>" + command.city.replace("_", " ") + ", " + command.state;
      // } else {
      //   html = "Weather command not recognized.";
      //   options = {
      //     options: {
      //       color: "red"
      //     }
      //   };
      // }
      // hipchat.sendMessage(req.clientInfo, req.context.item.room.id, html, options)
      //   .then(function (data) {
      //     res.send(200);
      //   });

      if(command.toLowerCase().indexOf('sanity') > -1) {
        request(
              {
                url:'http://10.5.100.89:8080/view/Denim-DashBoard/view/WebRTC/job/WebRTC_Chrome_Stable/buildWithParameters',
                method: 'POST'
              }, 
              function (error, response, body) {
                 if (!error && response.statusCode == 201) {
                    var options = {
                      options:{
                        color: "green"
                      }
                    };
                    var msg = "requested sanity triggered successfully";
                    hipchat.sendMessage(req.clientInfo, req.context.item.room.id, msg, options).then(function (data) {
                    res.send(200);
                 });
              }
        });
      }

      else {
            var options = {
                      options:{
                        color: "red"
                      }
            };
            var msg = "Invalid command";  
            hipchat.sendMessage(req.clientInfo, req.context.item.room.id, msg, options).then(function (data) {
                    res.send(200);
                 });
      }

    });



  // function parseCommand(cmd) {
  // var fullCommand = cmd.substr(cmd.indexOf(" ") + 1, cmd.length - 1);
  // var command = fullCommand.substr(0, fullCommand.indexOf(" ") + 1);
  // var cityState = fullCommand.substr(fullCommand.indexOf(command) + command.length);
  // var city = cityState.substr(0, cityState.indexOf(", "));
  // cityState = cityState.substr(cityState.indexOf(city) + city.length  + 2);
  // city = city.replace(" ", "_");
  // var state = cityState.substr(cityState.indexOf(" ") + 1);
  // return {
  //   command: command,
  //   city: city,
  //   state: state
  // };
  // }

  // Notify the room that the add-on was installed. To learn more about
  // Connect's install flow, check out:
  // https://developer.atlassian.com/hipchat/guide/installation-flow
  addon.on('installed', function(clientKey, clientInfo, req){
    var options = {
      options: {
        color: "green"
      }
    };
    var msg = 'The ' + addon.descriptor.name + ' add-on has been installed in this room';

    hipchat.sendMessage(clientInfo, req.body.roomId,msg,options);
  });

  // Clean up clients when uninstalled
  addon.on('uninstalled', function(id){
    addon.settings.client.keys(id+':*', function(err, rep){
      rep.forEach(function(k){
        addon.logger.info('Removing key:', k);
        addon.settings.client.del(k);
      });
    });
  });

};
