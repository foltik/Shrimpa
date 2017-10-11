function RegisterController($scope, AuthService) {
    $scope.register = function() {
        AuthService.register({
            username: $scope.username,
            password: $scope.password,
            invite: $scope.invite
        }).then(function() {
            alert('Registered');
        });
    };
}

angular.module('RegisterComp', ['AuthSvc']).component('registerComponent', {
    templateUrl: '/views/register-form.html',
    controller: RegisterController
});