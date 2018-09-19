import angular from 'angular';

// Create the module where our functionality can attach to
let domainNameSystem = angular.module('app.domainNameSystem', []);

// Include our UI-Router config settings
import domainNameSystemConfig from './domainNameSystem.config';
domainNameSystem.config(domainNameSystemConfig);

// Controllers
import domainNameSystemCtrl from './domainNameSystem.controller';
domainNameSystem.controller('domainNameSystemCtrl', domainNameSystemCtrl);


/////////////////////////////////////////////////////////////////

// Create the module where our functionality can attach to
let dnsSearch = angular.module('app.dnsSearch', []);

// Include our UI-Router config settings
import dnsSearchConfig from './search/dnsSearch.config';
dnsSearch.config(dnsSearchConfig);

// Controllers
import dnsSearchCtrl from './search/dnsSearch.controller';
dnsSearch.controller('dnsSearchCtrl', dnsSearchCtrl);

/////////////////////////////////////////////////////////////////

export default domainNameSystem;
