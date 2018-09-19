import nem from "nem-sdk";
import Helpers from '../utils/helpers';

function Paginate() {
    'ngInject';

    return {
        restrict:'E',
        scope: {
        	data: '=',
        	currentPage: '=currentPage',
        	pageSize: '=pageSize'
        },
        template: '<ng-include src="templatePaginate"/>',
        link: (scope) => {

        	scope.templatePaginate = 'layout/partials/paginate.html';
        	scope.Helpers = Helpers;
            scope.increment = function() {
                scope.currentPage = scope.currentPage+1;
            }
            scope.decrement = function() {
                scope.currentPage = scope.currentPage-1;
            }
            scope.goStart = function() {
                scope.currentPage = 0;
            }
            scope.goEnd = function() {
                scope.currentPage = Helpers.calcNumberOfPages(scope.data, scope.pageSize)-1;
            }
        }

    };
}

export default Paginate;