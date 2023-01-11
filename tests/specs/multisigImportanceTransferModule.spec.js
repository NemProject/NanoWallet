import { assertSuperNodes, assertTestnetNodes, assertMainnetNodes } from '../test/importanceTransferModuleTests';

describe('Multisig Importance transfer module tests', function() {
    let $controller, $rootScope, Wallet, DataBridge, Nodes, SuperNodeProgram, $timeout;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function(_$controller_, _$rootScope_, _$timeout_, _Wallet_, _DataBridge_, _Nodes_, _SuperNodeProgram_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        Wallet = _Wallet_;
        DataBridge = _DataBridge_;
        Nodes = _Nodes_;
        SuperNodeProgram = _SuperNodeProgram_;
    }));

    describe('setNodes', () => {
        it("returns pre set testnet nodes when network id is not mainnet", () => {
            assertTestnetNodes(
                $controller,
                $rootScope,
                'MultisigImportanceTransferCtrl',
                Wallet,
                Nodes,
                DataBridge
            );
        });

        it("returns superNodes when network id is mainnet", async (done) => {
            await assertSuperNodes(
                $controller,
                $rootScope,
                'MultisigImportanceTransferCtrl',
                Wallet,
                Nodes,
                DataBridge,
                SuperNodeProgram,
                $timeout
            );
            done();
        });

        it("returns pre set mainnet nodes when request superNodes fail", async (done) => {
            await assertMainnetNodes(
                $controller,
                $rootScope,
                'MultisigImportanceTransferCtrl',
                Wallet,
                Nodes,
                DataBridge,
                SuperNodeProgram,
                $timeout
            );
            done();
        });
    });
});
