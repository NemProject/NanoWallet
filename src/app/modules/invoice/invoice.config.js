function InvoiceConfig($stateProvider) {
    'ngInject';

    $stateProvider
        .state('app.invoice', {
            url: '/invoice',
            controller: 'InvoiceCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/invoice/invoice.html',
            title: 'Create an invoice'
        });

};

export default InvoiceConfig;