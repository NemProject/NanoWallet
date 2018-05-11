function CreateApostilleConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.createApostille', {
            url: '/create-apostille',
            controller: 'CreateApostilleCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/apostille/create/createApostille.html',
            title: 'Create apostille',
            params: {
                address: "",
                privateKey: "",
                tags: "",
                isUpdate: false
            }
        });

};

export default CreateApostilleConfig;