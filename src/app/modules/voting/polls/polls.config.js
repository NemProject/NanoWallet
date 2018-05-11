function pollsConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.votingPolls', {
            url: '/voting/polls',
            controller: 'pollsCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/voting/polls/polls.html',
            title: 'See Polls'
        });

};

export default pollsConfig;
