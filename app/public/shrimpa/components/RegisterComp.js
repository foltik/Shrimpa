var angular = require('angular');

angular.module('RegisterComp', ['AuthSvc']).component('registerComponent', {
    templateUrl: '/views/shrimpa/register-form.html',
    controller: ['$scope', '$timeout', 'AuthService', function($scope, $timeout, AuthService) {
        $scope.register = function() {
            AuthService.register($scope.username, $scope.password, $scope.invite).catch(function() {
                $scope.error = true;
                $timeout(function() {
                    $scope.error = false
                }, 820);
            });
        };
    }]
});