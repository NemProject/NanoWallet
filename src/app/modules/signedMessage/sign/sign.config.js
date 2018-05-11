function SignedMessageCreationConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.signedMessageCreation', {
            url: '/create-signed-message',
            controller: 'SignedMessageCreationCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/signedMessage/sign/sign.html',
            title: 'Create a signed message'
        });

};

export default SignedMessageCreationConfig;