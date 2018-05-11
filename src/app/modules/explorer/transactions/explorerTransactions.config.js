function ExplorerTransactionsConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.explorerTransactions', {
            url: '/explorer/transactions',
            controller: 'ExplorerTransactionsCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/explorer/transactions/explorerTransactions.html',
            title: 'Explorer - Transactions'
        });

};

export default ExplorerTransactionsConfig;