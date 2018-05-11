import angular from 'angular';

// Create the module where our functionality can attach to
let offlineTransactionCreateModule = angular.module('app.offlineTransactionCreate', []);

// Include our UI-Router config settings
import OfflineTransactionCreateConfig from './create/create.config';
offlineTransactionCreateModule.config(OfflineTransactionCreateConfig);

// Controllers
import OfflineTransactionCreateCtrl from './create/create.controller';
offlineTransactionCreateModule.controller('OfflineTransactionCreateCtrl', OfflineTransactionCreateCtrl);

// Create the module where our functionality can attach to
let offlineTransactionSendModule = angular.module('app.offlineTransactionSend', []);

// Include our UI-Router config settings
import OfflineTransactionSendConfig from './broadcast/broadcast.config';
offlineTransactionSendModule.config(OfflineTransactionSendConfig);

// Controllers
import OfflineTransactionSendCtrl from './broadcast/broadcast.controller';
offlineTransactionSendModule.controller('OfflineTransactionSendCtrl', OfflineTransactionSendCtrl);

export default offlineTransactionCreateModule;
