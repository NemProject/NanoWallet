function ApostilleMessageConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.apostilleMessage', {
            url: '/apostille/message',
            controller: 'ApostilleMessageCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/apostille/message/apostilleMessage.html',
            title: 'Apostille message',
            params: {
                address: "",
                privateKey: ""
            }
        });

};

export default ApostilleMessageConfig;