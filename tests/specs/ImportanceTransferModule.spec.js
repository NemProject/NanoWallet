import WalletFixture from '../data/wallet';
import AccountDataFixture from '../data/accountData';
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

    function createDummyWalletContextTestnet(Wallet) {
        Wallet.use(WalletFixture.testnetWallet);
        Nodes.setDefault();
        DataBridge.accountData = AccountDataFixture.testnetAccountData;
    }

    function createDummyWalletContextMainnet(Wallet) {
        Wallet.use(WalletFixture.mainnetWallet);
        Nodes.setDefault();
        DataBridge.accountData = AccountDataFixture.mainnetAccountData;
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
        expect(ctrl.nodes[0]).toEqual(nem.model.objects.create("endpoint")("http://hugetestalice.nem.ninja", 7890));
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

    describe('setNodes', () => {
        it("returns pre set testnet nodes when network id is not mainnet", () => {
            // Arrange:
            createDummyWalletContextTestnet(Wallet);

            const ctrl = $controller('ImportanceTransferCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            ctrl.setNodes();

            // Assert:
            expect(ctrl.nodes).toEqual([
                {
                    "host": "http://hugetestalice.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://hugetestalice2.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://medalice2.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://localhost",
                    "port": 7890
                }
            ]);
        });

        it("returns superNodes when network id is mainnet", async (done) => {
            // Arrange:
            const expectedDTO = new Array(2).fill({
                endpoint: "http://localhost:7890",
                id: 1,
                name: 'superNode',
                status: 'active'
            });

            spyOn(SuperNodeProgram, 'getNodes').and.returnValue(Promise.resolve(expectedDTO));

            createDummyWalletContextMainnet(Wallet);

            const ctrl = $controller('ImportanceTransferCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.setNodes();
            $timeout.flush();

            // Assert:
            expect(ctrl.nodes).toEqual([
                {
                    "host": "http://localhost",
                    "port": 7890
                },
                {
                    "host": "http://localhost",
                    "port": 7890
                }
            ]);
            done()
        });

        it("returns pre set mainnet nodes when request superNodes fail", async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodes').and.returnValue(Promise.reject('error'));

            createDummyWalletContextMainnet(Wallet);

            const ctrl = $controller('ImportanceTransferCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.setNodes();
            $timeout.flush();

            // Assert:
            expect(ctrl.nodes).toEqual([
                {
                    "host": "http://hugealice.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://hugealice2.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://hugealice3.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://hugealice4.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://62.75.171.41",
                    "port": 7890
                },
                {
                    "host": "http://san.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://go.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://hachi.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://jusan.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://nijuichi.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice2.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice3.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice4.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice5.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice6.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://alice7.nem.ninja",
                    "port": 7890
                },
                {
                    "host": "http://localhost",
                    "port": 7890
                }
            ]);
            done();
        });
    });
});