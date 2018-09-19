function importWalletQrCodeConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.importWalletQrCode', {
            url: '/import-wallet-qr-code',
            controller: 'importWalletQrCodeCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/importWalletQrCode/index.html',
            title: 'Import wallet QR code'
        });

};

export default importWalletQrCodeConfig;