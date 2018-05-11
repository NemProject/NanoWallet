import angular from 'angular';

// Create the module where our functionality can attach to
let explorerHomeModule = angular.module('app.explorerHome', []);

// Include our UI-Router config settings
import ExplorerHomeConfig from './home/explorerHome.config';
explorerHomeModule.config(ExplorerHomeConfig);

// Controllers
import ExplorerHomeCtrl from './home/explorerHome.controller';
explorerHomeModule.controller('ExplorerHomeCtrl', ExplorerHomeCtrl);

// Create the module where our functionality can attach to
let explorerApostillesModule = angular.module('app.explorerApostilles', []);

// Include our UI-Router config settings
import ExplorerApostillesConfig from './apostilles/explorerApostilles.config';
explorerApostillesModule.config(ExplorerApostillesConfig);

// Controllers
import ExplorerApostillesCtrl from './apostilles/explorerApostilles.controller';
explorerApostillesModule.controller('ExplorerApostillesCtrl', ExplorerApostillesCtrl);

// Create the module where our functionality can attach to
let explorerNamespacesMosaicsModule = angular.module('app.explorerNamespacesMosaics', []);

// Include our UI-Router config settings
import ExplorerNamespacesMosaicsConfig from './namespaces-mosaics/namespaces-mosaics.config';
explorerNamespacesMosaicsModule.config(ExplorerNamespacesMosaicsConfig);

// Controllers
import ExplorerNamespacesMosaicsCtrl from './namespaces-mosaics/namespaces-mosaics.controller';
explorerNamespacesMosaicsModule.controller('ExplorerNamespacesMosaicsCtrl', ExplorerNamespacesMosaicsCtrl);

// Create the module where our functionality can attach to
let accountsExplorerModule = angular.module('app.accountsExplorer', []);

// Include our UI-Router config settings
import AccountsExplorerConfig from './accounts/accountsExplorer.config';
accountsExplorerModule.config(AccountsExplorerConfig);

// Controllers
import AccountsExplorerCtrl from './accounts/accountsExplorer.controller';
accountsExplorerModule.controller('AccountsExplorerCtrl', AccountsExplorerCtrl);

// Create the module where our functionality can attach to
let transactionsExplorerModule = angular.module('app.explorerTransactions', []);

// Include our UI-Router config settings
import ExplorerTransactionsConfig from './transactions/explorerTransactions.config';
transactionsExplorerModule.config(ExplorerTransactionsConfig);

// Controllers
import ExplorerTransactionsCtrl from './transactions/explorerTransactions.controller';
transactionsExplorerModule.controller('ExplorerTransactionsCtrl', ExplorerTransactionsCtrl);

// Components
import ExplorerNav from './layout/nav.component';
explorerHomeModule.component('explorerNav', ExplorerNav);

export default explorerHomeModule;
