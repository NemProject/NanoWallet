function dnsSearchConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.dnsSearch', {
            url: '/domainNameSystem/search',
            controller: 'dnsSearchCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/domainNameSystem/search/dnsSearch.html',
            title: 'DNS search'
        });
  
};

export default dnsSearchConfig;