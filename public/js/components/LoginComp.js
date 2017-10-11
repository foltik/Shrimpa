function LoginController($scope, AuthService) {
    $scope.login = function() {
        AuthService.login({
            username: $scope.username,
            password: $scope.password
        }).then(function() {
            alert('Logged In');
        });
    }
}

angular.module('LoginComp', ['AuthSvc']).component('loginComponent', {
    templateUrl: '/views/login-form.html',
    controller: LoginController
});