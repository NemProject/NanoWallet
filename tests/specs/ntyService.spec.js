describe('Nty service tests', function() {
    let $controller, $rootscope, Wallet, Nty, $localStorage;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function( _$controller_, _$rootScope_, _Wallet_, _Nty_, _$localStorage_) {
        $controller = _$controller_;
        $rootscope = _$rootScope_;
        Wallet = _Wallet_;
        Nty = _Nty_;
        $localStorage = _$localStorage_;
        $localStorage.$reset();
    }));

    function createDummyContext() {
        let context = {};
        context.filledText = [];
        context.fillText = function(text, x, y) {
            context.filledText.push([text, x, y]);
        }
        context.measureText = function(text) {
            return { 
                width: 10*text.length
            };
        }
        context.clear = function() {
            context.filledText = [];
        }
        return context;
    }

    //_fillTextMultiline = (context, text, x, y, mode, re, lineHeight, maxX = undefined)

    it("Checks _fillTextMultiline utility function", function() {
        var context = createDummyContext();
        var y;

        context.clear();
        y = Nty._fillTextMultiline(context, "", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(''), 7, undefined);
        expect(y).toBe(0);
        expect(context.filledText).toEqual([ ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(''), 7, 30);
        expect(y).toBe(0);
        expect(context.filledText).toEqual([ ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hello world", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(' '), 7, 30);
        expect(y).toBe(28);
        expect(context.filledText).toEqual([ [ 'hel', 0, 0 ], [ 'lo' , 0, 7 ], [ 'wor', 0, 14 ], [ 'ld', 0, 21 ] ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hello", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(''), 7, 30);
        expect(y).toBe(14);
        expect(context.filledText).toEqual([ [ 'hel', 0, 0 ], [ 'lo', 0, 7 ] ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hello", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(''), 7, undefined);
        expect(y).toBe(35);
        expect(context.filledText).toEqual([ [ 'h', 0, 0 ], [ 'e', 0, 7 ], [ 'l', 0, 14 ], [ 'l', 0, 21 ], [ 'o', 0, 28 ] ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hello", 0, 0, Nty.MULTILINE_MODE.SPLIT, new RegExp(''), 7, 30);
        expect(y).toBe(14);
        expect(context.filledText).toEqual([ [ 'hel', 0, 0 ], [ 'lo', 0, 7 ] ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hellohellohelloh", 0, 0, Nty.MULTILINE_MODE.MATCH, new RegExp('.{1,6}', 'g'), 7, undefined);
        expect(y).toBe(21);
        expect(context.filledText).toEqual([ [ 'helloh', 0, 0 ], [ 'ellohe', 0, 7 ], [ 'lloh', 0, 14 ] ]);

        context.clear();
        y = Nty._fillTextMultiline(context, "hellohellohelloh", 0, 0, Nty.MULTILINE_MODE.MATCH, new RegExp('.{1,6}', 'g'), 7, 50);
        expect(y).toBe(35);
        expect(context.filledText).toEqual([ [ 'hello', 0, 0 ], [ 'h' , 0, 7 ], [ 'elloh', 0, 14 ], [ 'e', 0, 21 ], [ 'lloh' , 0, 28] ]);
    });

});