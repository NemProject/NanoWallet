function CreateMultisigConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.createMultisig', {
            url: '/create-multisignature-contract',
            controller: 'CreateMultisigCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/multisignature/create/createMultisig.html',
            title: 'Create a multisignature contract',
            params: {
                address: "",
                privateKey: ""
            }
        });

};

export default CreateMultisigConfig;