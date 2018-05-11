function createPollConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.votingCreatePoll', {
            url: '/voting/createPoll',
            controller: 'createPollCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/voting/createPoll/createPoll.html',
            title: 'Create Poll'
        });

};

export default createPollConfig;
