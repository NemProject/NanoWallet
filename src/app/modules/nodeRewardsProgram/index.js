import angular from 'angular';

// Create the module where our functionality can attach to
let nodeRewardsProgramModule = angular.module('app.nodeRewardsProgram', []);

// Include our UI-Router config settings
import NodeRewardsProgramConfig from './nodeRewardsProgram.config';
nodeRewardsProgramModule.config(NodeRewardsProgramConfig);

// Controllers
import NodeRewardsProgramCtrl from './nodeRewardsProgram.controller';
nodeRewardsProgramModule.controller('NodeRewardsProgramCtrl', NodeRewardsProgramCtrl);

export default nodeRewardsProgramModule;
