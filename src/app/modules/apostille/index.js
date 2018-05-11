import angular from 'angular';

// Create the module where our functionality can attach to
let createApostilleModule = angular.module('app.createApostille', []);

// Include our UI-Router config settings
import CreateApostilleConfig from './create/createApostille.config';
createApostilleModule.config(CreateApostilleConfig);

// Controllers
import CreateApostilleCtrl from './create/createApostille.controller';
createApostilleModule.controller('CreateApostilleCtrl', CreateApostilleCtrl);

// Create the module where our functionality can attach to
let auditApostilleModule = angular.module('app.auditApostille', []);

// Include our UI-Router config settings
import AuditApostilleConfig from './audit/auditApostille.config';
auditApostilleModule.config(AuditApostilleConfig);

// Controllers
import AuditApostilleCtrl from './audit/auditApostille.controller';
auditApostilleModule.controller('AuditApostilleCtrl', AuditApostilleCtrl);

// Create the module where our functionality can attach to
let apostilleHistoryModule = angular.module('app.apostilleHistory', []);

// Include our UI-Router config settings
import ApostilleHistoryConfig from './history/apostilleHistory.config';
apostilleHistoryModule.config(ApostilleHistoryConfig);

// Controllers
import ApostilleHistoryCtrl from './history/apostilleHistory.controller';
apostilleHistoryModule.controller('ApostilleHistoryCtrl', ApostilleHistoryCtrl);

// Create the module where our functionality can attach to
let apostilleMessageModule = angular.module('app.apostilleMessage', []);

// Include our UI-Router config settings
import ApostilleMessageConfig from './message/apostilleMessage.config';
apostilleMessageModule.config(ApostilleMessageConfig);

// Controllers
import ApostilleMessageCtrl from './message/apostilleMessage.controller';
apostilleMessageModule.controller('ApostilleMessageCtrl', ApostilleMessageCtrl);

export default createApostilleModule;
