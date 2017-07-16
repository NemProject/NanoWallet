/**
 * Part of the evias/NanoWallet package.
 *
 * This file describes the ROUTES of the NodeJS
 * server in `server.js`.
 *
 * Basically only one route is defined that will
 * serve the Wallet's build/start.html file (and
 * subsequent build/ files requests).
 *
 * @package    evias/NanoWallet
 * @subpackage NodeJS Server
 * @version    1.3.0
 * @author     Grégory Saive <greg@evias.be>
 * @copyright  (c) 2017, Grégory Saive <greg@evias.be>
 */

module.exports = function(app)
{
	// =====================================
	// Serve the Wallet built HTML ========
	// =====================================
	app.get('/', function(req, res) {
		console.log("__dirname is " + __dirname);
		res.sendFile(__dirname + '/build/start.html');
  	});

	// =====================================
	// 404 Route ===========================
	// =====================================
	app.get('*', function(req, res){
		res.redirect('/');
	});

}