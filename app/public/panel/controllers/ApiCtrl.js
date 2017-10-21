var angular = require('angular');

angular.module('ApiCtrl', ['ApiSvc', 'AuthSvc']).controller('ApiController', ['$scope', 'ApiService', 'AuthService', function($scope, ApiService, AuthService) {
    $scope.getKeys = function() {
        ApiService.getAll(function(keys) {
            $scope.keys = keys;
        });
        console.log($scope.keys);
    };

    $scope.hideNewKey = function() {
        $scope.nModalShow = false;
    };
    $scope.showNewKey = function() {
        $scope.nModalShow = true;
    };

    $scope.hideKeyInfo = function() {
        $scope.kModalShow = false;
    };
    $scope.showKeyInfo = function(key) {
        $scope.kModalShow = true;
        $scope.currKey = key;
    };

    $scope.deleteKey = function(key) {
        ApiService.deleteKey(key, function() {
            var index = $scope.keys.indexOf(key);
            console.log('removing index' + index);
            $scope.keys.splice(index, 1);
            $scope.hideKeyInfo();
            $scope.currKey = {};
        });
    };
}]);