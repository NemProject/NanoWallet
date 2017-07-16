/**
 * Part of the evias/NanoWallet package.
 *
 * This NodeJS server can be used to serve the build/
 * files on a heroku server or locally. To serve the
 * latest file you must first build:
 * $ node node_modules/gulp/bin/gulp default
 * $ node server.js
 *
 * Heroku will handle build automatically after deploy
 * given you are pushing to the master branch. You
 * can also manually deploy the application through
 * the Heroku dashboard by selecting the branch you
 * are working on. The build process is described in
 * `package.json`.
 *
 * @package    evias/NanoWallet
 * @subpackage NodeJS Server
 * @version    1.3.0
 * @author     Grégory Saive <greg@evias.be>
 * @copyright  (c) 2017, Grégory Saive <greg@evias.be>
 */

// Setup
var express  = require('express');
var morgan   = require('morgan');
var app      = express();
var http     = require('http');

app.use(express.static("build/"));
app.use(morgan('dev')); // log every request to the console

// Routes
require('./routes.js')(app); // load our routes and pass in our app

var port = process.env['PORT'] = process.env.PORT || 4000;

/**
 * Following middleware redirects the browser to using HTTPS
 * always. This is required for heroku too.
 */
app.all('*', function(req, res, next)
    {
        if (req.headers['x-forwarded-proto'] != 'https')
            res.redirect('https://' + req.headers.host + req.url)
        else
            next() /* Continue to other routes if we're not redirecting */
    });

/**
 * No need for HTTPS, heroku handles that automatically by creating a
 * mirror HTTPS server of our http server.
 *
 * This means we don't need to manage certificates either.
 * The application handles all route through a middleware that
 * obligates HTTPS access and the / route serves the build/start.html
 * file.
 */
http.createServer(app).listen(port, function()
    {
        console.log("NEM NanoWallet (eVias fork) Server listening on Port %d in %s mode", this.address().port, app.settings.env);
    });

console.log('NEM NanoWallet (eVias fork) is now Online');
