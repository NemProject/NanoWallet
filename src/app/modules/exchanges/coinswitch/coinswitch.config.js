function CoinSwitchConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.coinswitch', {
            url: '/coinswitch-buy-xem',
            controller: 'CoinSwitchCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/exchanges/coinswitch/coinswitch.html',
            title: 'Convert to XEM'
        });

};

export default CoinSwitchConfig;