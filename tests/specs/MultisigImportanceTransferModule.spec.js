import WalletFixture from '../data/wallet';
import AccountDataFixture from '../data/accountData';

describe('Multisig Importance transfer module tests', function() {
    let $controller, $rootScope, Wallet, DataBridge, $filter, Nodes, SuperNodeProgram, $timeout;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function(_$filter_, _$controller_, _$rootScope_, _$timeout_, _Wallet_, _DataBridge_, _Nodes_, _SuperNodeProgram_) {
        $controller = _$controller_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        Wallet = _Wallet_;
        DataBridge = _DataBridge_;
        $filter = _$filter_;
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