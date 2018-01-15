var angular = require('angular');

angular.module('RegisterComp', ['AuthSvc']).component('registerComponent', {
    templateUrl: '/views/shimapan/register-form.html',
    controller: ['$scope', '$timeout', 'AuthService', function ($scope, $timeout, AuthService) {
        $scope.register = function () {
            AuthService.register({
                username: $scope.username,
                password: $scope.password,
                invite: $scope.invite
            }).catch(function() {
                $scope.error = true;
                $timeout(function() {
                    $scope.error = false
                }, 820);
            });
        };
    }]
});