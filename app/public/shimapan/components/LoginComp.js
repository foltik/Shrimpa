var angular = require('angular');

angular.module('LoginComp', ['AuthSvc']).component('loginComponent', {
    templateUrl: '/views/shimapan/login-form.html',
    controller: ['$scope', '$timeout', 'AuthService', function ($scope, $timeout, AuthService) {
        $scope.login = function () {
            AuthService.login({
                username: $scope.username,
                password: $scope.password
            }).catch(function(err) {
                $scope.error = true;
                $timeout(function() {
                    $scope.error = false;
                },820);
            });
        };
    }]
});