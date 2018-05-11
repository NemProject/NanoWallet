function TransferTransactionConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.transferTransaction', {
            url: '/transfer-transactions',
            controller: 'TransferTransactionCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/transferTransaction/transferTransaction.html',
            title: 'Send a transaction',
            params: {
            	address: ''
            }
        });

};

export default TransferTransactionConfig;