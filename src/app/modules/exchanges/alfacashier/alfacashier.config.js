function AlfacashierConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.alfacashier', {
            url: '/alfacashier-buy-xem',
            controller: 'AlfacashierCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/exchanges/alfacashier/alfacashier.html',
            title: 'Buy XEM on ALFAcashier'
        });

};

export default AlfacashierConfig;
