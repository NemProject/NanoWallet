function OfflineTransactionCreateConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.offlineTransactionCreate', {
            url: '/create-offline-transaction',
            controller: 'OfflineTransactionCreateCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/offlineTransaction/create/create.html',
            title: 'Oflline transaction - Create'
        });

};

export default OfflineTransactionCreateConfig;