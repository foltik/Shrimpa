var angular = require('angular');

angular.module('ApiCtrl', ['ApiSvc', 'AuthSvc']).controller('ApiController', ['$scope', 'ApiService', 'AuthService', function($scope, ApiService, AuthService) {
    $scope.getKeys = function() {
        ApiService.getAll(function(keys) {
            $scope.keys = keys;
        });
        console.log($scope.keys);
    };
}]);