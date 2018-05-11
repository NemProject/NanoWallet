function OfflineTransactionSendConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.offlineTransactionSend', {
            url: '/broadcast-offline-transaction',
            controller: 'OfflineTransactionSendCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/offlineTransaction/broadcast/broadcast.html',
            title: 'Oflline transaction - Broadcast',
            params: {
            	signedTransaction: ''
            }
        });

};

export default OfflineTransactionSendConfig;