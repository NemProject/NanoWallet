function SignedMessageVerificationConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.signedMessageVerification', {
            url: '/verify-signed-message',
            controller: 'SignedMessageVerificationCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/signedMessage/verify/verify.html',
            title: 'Verify a signed message'
        });

};

export default SignedMessageVerificationConfig;