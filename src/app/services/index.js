import angular from 'angular';

// Create the module where our functionality can attach to
let servicesModule = angular.module('app.services', ['ngToast']);

// Set Alert service
import AlertService from './alert.service';
servicesModule.service('Alert', AlertService);

// Set WalletBuilder service
import WalletBuilderService from './walletBuilder.service';
servicesModule.service('WalletBuilder', WalletBuilderService);

// Set wallet Service
import WalletService from './wallet.service';
servicesModule.service('Wallet', WalletService);

// Set DataBridge service
import DataBridgeService from './dataBridge.service';
servicesModule.service('DataBridge', DataBridgeService);

// Set Nodes service
import NodesService from './nodes.service';
servicesModule.service('Nodes', NodesService);

// Set NTY service
import NtyService from './nty.service';
servicesModule.service('Nty', NtyService);

// Set AddressBook service
import AddressBookService from './addressBook.service';
servicesModule.service('AddressBook', AddressBookService);

// Set Recipient service
import RecipientService from './recipient.service';
servicesModule.service('Recipient', RecipientService);

// Set DataStore service
import DataStoreService from './dataStore.service';
servicesModule.service('DataStore', DataStoreService);

// Set Login service
import LoginService from './login.service';
servicesModule.service('Login', LoginService);

// Set VotingUtils service
import VotingUtilsService from './votingUtils.service';
servicesModule.service('VotingUtils', VotingUtilsService);

// Set Voting service
import VotingService from './voting.service';
servicesModule.service('Voting', VotingService);

export default servicesModule;