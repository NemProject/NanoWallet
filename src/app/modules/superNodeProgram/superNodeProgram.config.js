function SuperNodeProgramConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.superNodeProgram', {
            url: '/superNodeProgram',
            controller: 'SuperNodeProgramCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/superNodeProgram/superNodeProgram.html',
            title: 'SuperNode Program'
        });
};

export default SuperNodeProgramConfig;
