angular.module('NavCtrl', ['AuthSvc']).controller('NavController', ['$scope', '$window', 'AuthService', function($scope, $window, AuthService) {
    $scope.isLoggedIn = AuthService.isLoggedIn();
    $scope.currentUser = AuthService.currentUser();
    $scope.currentScope = AuthService.currentScope();
    $scope.logout = AuthService.logout;

    $scope.hasPermission = function(permission) {
        if (!$scope.currentScope) return false;
        return $scope.currentScope.indexOf(permission) !== -1;
    };

}]);