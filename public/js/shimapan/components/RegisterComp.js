angular.module('RegisterComp', ['AuthSvc']).component('registerComponent', {
    templateUrl: '/views/shimapan/register-form.html',
    controller: ['$scope', 'AuthService', function ($scope, AuthService) {
        $scope.register = function () {
            AuthService.register({
                username: $scope.username,
                password: $scope.password,
                invite: $scope.invite
            });
        };
    }]
});