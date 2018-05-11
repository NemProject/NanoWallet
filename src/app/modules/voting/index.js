import angular from 'angular';

/***********polls*************/
// Create the module where our functionality can attach to
let pollsModule = angular.module('app.votingPolls', []);

// Include our UI-Router config settings
import pollsConfig from './polls/polls.config';
pollsModule.config(pollsConfig);

// Controllers
import pollsCtrl from './polls/polls.controller';
pollsModule.controller('pollsCtrl', pollsCtrl);

/***************** createPoll ****************/
// Create the module where our functionality can attach to
let createPollModule = angular.module('app.votingCreatePoll', []);

// Include our UI-Router config settings
import createPollConfig from './createPoll/createPoll.config';
createPollModule.config(createPollConfig);

// Controllers
import createPollCtrl from './createPoll/createPoll.controller';
createPollModule.controller('createPollCtrl', createPollCtrl);

export default pollsModule;
