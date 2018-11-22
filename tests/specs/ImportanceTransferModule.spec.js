import WalletFixture from '../data/wallet';
import AccountDataFixture from '../data/accountData';
import nem from 'nem-sdk';

describe('Importance transfer module tests', function() {
    let $controller, $rootScope, Wallet, DataBridge, $q, $filter, Nodes;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function(_$filter_, _$controller_, _$rootScope_, _Wallet_, _DataBridge_, _$q_, _Nodes_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        Wallet = _Wallet_;
        DataBridge = _DataBridge_;
        $q = _$q_;
        $filter = _$filter_;
        Nodes = _Nodes_;
    }));

    function createDummyWalletContextTestnet(Wallet) {
        Wallet.use(WalletFixture.testnetWallet);
        Nodes.setDefault();
        DataBridge.accountData = AccountDataFixture.testnetAccountData;
    }


    it("Default properties initialized", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
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
        expect(ctrl.nodes[0]).toEqual(nem.model.objects.create("endpoint")("http://104.128.226.60", 7890));
        expect(ctrl.showSupernodes).toBe(false);
    });

    it("Can update remote account if custom key enabled", function() {
        // Arrange:
        let scope = $rootScope.$new();
        createDummyWalletContextTestnet(Wallet)
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
        createDummyWalletContextTestnet(Wallet)
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
        createDummyWalletContextTestnet(Wallet)
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
        createDummyWalletContextTestnet(Wallet)
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

});