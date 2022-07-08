import angular from 'angular';

// Create the module where our functionality can attach
const superNodeProgramModule = angular.module('app.superNodeProgram', []);

// Include our UI-Router config settings
import superNodeProgramConfig from './superNodeProgram.config';
superNodeProgramModule.config(superNodeProgramConfig);

// Controllers
import superNodeProgramCtrl from './superNodeProgram.controller';
superNodeProgramModule.controller('SuperNodeProgramCtrl', superNodeProgramCtrl);

export default superNodeProgramModule;
