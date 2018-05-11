import angular from 'angular';

// Create the module where our functionality can attach to
let invoiceModule = angular.module('app.invoice', []);

// Include our UI-Router config settings
import InvoiceConfig from './invoice.config';
invoiceModule.config(InvoiceConfig);

// Controllers
import InvoiceCtrl from './invoice.controller';
invoiceModule.controller('InvoiceCtrl', InvoiceCtrl);

export default invoiceModule;
