import angular from 'angular';

// Create the module where our functionality can attach to
let componentsModule = angular.module('app.components', []);

// Set market-data component
import MarketData from './marketData.component';
componentsModule.component('marketData', MarketData);

// Set balance component
import Balance from './balance.component';
componentsModule.component('balance', Balance);

// Set node component
import Node from './node.component';
componentsModule.component('node', Node);

// Set account-input component
import AccountInput from './accountInput.component';
componentsModule.component('accountInput', AccountInput);

// Set message-area component
import MessageArea from './messageArea.component';
componentsModule.component('messageArea', MessageArea);

// Set attach-mosaic component
import AttachMosaic from './attachMosaic.component';
componentsModule.component('attachMosaic', AttachMosaic);

// Set multisig-select component
import MultisigSelect from './multisigSelect.component';
componentsModule.component('multisigSelect', MultisigSelect);

// Set news component
import News from './news.component';
componentsModule.component('news', News);

// Set invoice component
import Invoice from './invoice.component';
componentsModule.component('invoice', Invoice);

// Set tx-confirmation component
import TxConfirmation from './txConfirmation.component';
componentsModule.component('txConfirmation', TxConfirmation);

export default componentsModule;