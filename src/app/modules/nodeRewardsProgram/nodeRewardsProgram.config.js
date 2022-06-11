function NodeRewardsProgramConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.nodeRewardsProgram', {
            url: '/nodeRewardsProgram',
            controller: 'NodeRewardsProgramCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/nodeRewardsProgram/nodeRewardsProgram.html',
            title: 'Node Rewards Program'
        });
};

export default NodeRewardsProgramConfig;
