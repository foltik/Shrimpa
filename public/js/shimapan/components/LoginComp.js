angular.module('LoginComp', ['AuthSvc']).component('loginComponent', {
    templateUrl: '/views/shimapan/login-form.html',
    controller: ['$scope', 'AuthService', function ($scope, AuthService) {
        $scope.login = function () {
            AuthService.login({
                username: $scope.username,
                password: $scope.password
            });
        };
    }]
});