function domainNameSystemConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.domainNameSystem', {
            url: '/domainNameSystem',
            controller: 'domainNameSystemCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/domainNameSystem/domainNameSystem.html',
            title: 'Configure DNS'
        });

};

export default domainNameSystemConfig;