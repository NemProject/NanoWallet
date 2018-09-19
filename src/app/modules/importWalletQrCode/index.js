import angular from 'angular';

// Create the module where our functionality can attach to
let importWalletQrCodeModule = angular.module('app.importWalletQrCode', []);

// Include our UI-Router config settings
import importWalletQrCodeConfig from './importQrCode.config';
importWalletQrCodeModule.config(importWalletQrCodeConfig);

// Controllers
import importWalletQrCodeCtrl from './importQrCode.controller';
importWalletQrCodeModule.controller('importWalletQrCodeCtrl', importWalletQrCodeCtrl);

export default importWalletQrCodeModule;
