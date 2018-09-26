import angular from 'angular';

// Create the module where our functionality can attach to
let ChangellyModule = angular.module('app.changelly', []);

// Include our UI-Router config settings
import ChangellyConfig from './changelly/changelly.config';
ChangellyModule.config(ChangellyConfig);

// Controllers
import ChangellyCtrl from './changelly/changelly.controller';
ChangellyModule.controller('ChangellyCtrl', ChangellyCtrl);

// Create the module where our functionality can attach to
let ShapeshiftModule = angular.module('app.shapeshift', []);

// Include our UI-Router config settings
import ShapeshiftConfig from './shapeshift/shapeshift.config';
ShapeshiftModule.config(ShapeshiftConfig);

// Controllers
import ShapeshiftCtrl from './shapeshift/shapeshift.controller';
ShapeshiftModule.controller('ShapeshiftCtrl', ShapeshiftCtrl);

// Create the module where our functionality can attach to
let CoinSwitchModule = angular.module('app.coinswitch', []);

// Include our UI-Router config settings
import CoinSwitchConfig from './coinswitch/coinswitch.config';
CoinSwitchModule.config(CoinSwitchConfig);

// Controllers
import CoinSwitchCtrl from './coinswitch/coinswitch.controller';
CoinSwitchModule.controller('CoinSwitchCtrl', CoinSwitchCtrl);

export default ChangellyModule;