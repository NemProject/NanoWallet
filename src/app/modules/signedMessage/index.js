import angular from 'angular';

// Create the module where our functionality can attach to
let signedMessageCreationModule = angular.module('app.signedMessageCreation', []);

// Include our UI-Router config settings
import SignedMessageCreationConfig from './sign/sign.config';
signedMessageCreationModule.config(SignedMessageCreationConfig);

// Controllers
import SignedMessageCreationCtrl from './sign/sign.controller';
signedMessageCreationModule.controller('SignedMessageCreationCtrl', SignedMessageCreationCtrl);

// Create the module where our functionality can attach to
let signedMessageVerificationConfigModule = angular.module('app.signedMessageVerification', []);

// Include our UI-Router config settings
import SignedMessageVerificationConfig from './verify/verify.config';
signedMessageVerificationConfigModule.config(SignedMessageVerificationConfig);

// Controllers
import SignedMessageVerificationCtrl from './verify/verify.controller';
signedMessageVerificationConfigModule.controller('SignedMessageVerificationCtrl', SignedMessageVerificationCtrl);

export default signedMessageCreationModule;
