import {
    assertSuperNodes,
    assertTestnetNodes,
    assertMainnetNodes,
    setupTestnetWallet
} from '../test/importanceTransferModuleTests';
import nem from 'nem-sdk';

describe('Importance transfer module tests', function() {
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

    it("Default properties initialized", function() {
        // Arrange:
        let scope = $rootScope.$new();
        setupTestnetWallet(Wallet, Nodes, DataBridge);
        let ctrl = $controller('ImportanceTransferCtrl', {
            $scope: scope
        });

        // Assert
        expect(ctrl.formData).toEqual({
            remoteAccount: Wallet.currentAccount.child,
            mode: 1,
            isMultisig: false,
            multisigAccount: ''
        });
        expect(ctrl.modes).toEqual([{
            name: "Activate",
            key: 1
        }, {
            name: "Deactivate",
            key: 2
        }]);
        expect(ctrl.okPressed).toBe(false);
        expect(ctrl.common).toEqual(nem.model.objects.get("common"));
        expect(ctrl.isCustomNode).toBe(false);
        expect(ctrl.customHarvestingNode).toEqual("");
        expect(ctrl.harvestingNode).toEqual(Wallet.node);
        expect(ctrl.hasFreeSlots).toBe(false);
        expect(ctrl.nodes[0]).toEqual(nem.model.objects.create("endpoint")("http://hugetestalice.nem.ninja", 7890));
        expect(ctrl.showSupernodes).toBe(false);
    });

    it("Can update remote account if custom key enabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        setupTestnetWallet(Wallet, Nodes, DataBridge);
        let ctrl = $controller('ImportanceTransferCtrl', {
            $scope: scope
        });

        // Act
        ctrl.customKey = true;
        ctrl.updateRemoteAccount();

        // Assert
        expect(ctrl.formData.remoteAccount).toEqual('');
    });

    it("Can update remote account if custom key enabled then disabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        setupTestnetWallet(Wallet, Nodes, DataBridge);
        let ctrl = $controller('ImportanceTransferCtrl', {
            $scope: scope
        });

        // Act
        ctrl.customKey = true;
        ctrl.updateRemoteAccount();
        ctrl.customKey = false;
        ctrl.updateRemoteAccount();

        // Assert
        expect(ctrl.formData.remoteAccount).toEqual(Wallet.currentAccount.child);
    });

    it("Can set mode to deactivate", function() {
        // Arrange:
        let scope = $rootScope.$new();
        setupTestnetWallet(Wallet, Nodes, DataBridge);
        let ctrl = $controller('ImportanceTransferCtrl', {
            $scope: scope
        });

        // Act
        ctrl.formData.mode = 2;

        // Assert
        expect(ctrl.formData).toEqual({
            remoteAccount: Wallet.currentAccount.child,
            mode: 2,
            isMultisig: false,
            multisigAccount: ''
        });
    });

    it("Can set mode to 'activate' after 'deactivate'", function() {
        // Arrange:
        let scope = $rootScope.$new();
        setupTestnetWallet(Wallet, Nodes, DataBridge);
        let ctrl = $controller('ImportanceTransferCtrl', {
            $scope: scope
        });

        // Act
        ctrl.formData.mode = 2;
        ctrl.formData.mode = 1;

        // Assert
        expect(ctrl.formData).toEqual({
            remoteAccount: Wallet.currentAccount.child,
            mode: 1,
            isMultisig: false,
            multisigAccount: ''
        });
    });

    describe('setNodes', () => {
        it("returns pre set testnet nodes when network id is not mainnet", () => {
            assertTestnetNodes(
                $controller,
                $rootScope,
                'ImportanceTransferCtrl',
                Wallet,
                Nodes,
                DataBridge
            );
        });

        it("returns superNodes when network id is mainnet", async (done) => {
            await assertSuperNodes(
                $controller,
                $rootScope,
                'ImportanceTransferCtrl',
                Wallet,
                Nodes,
                DataBridge,
                SuperNodeProgram,
                $timeout
            );
            done()
        });

        it("returns pre set mainnet nodes when request superNodes fail", async (done) => {
            await assertMainnetNodes(
                $controller,
                $rootScope,
                'ImportanceTransferCtrl',
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
