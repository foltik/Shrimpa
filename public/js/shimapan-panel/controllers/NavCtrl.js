angular.module('NavCtrl', ['AuthSvc']).controller('NavController', ['$scope', '$window', 'AuthService', function($scope, $window, AuthService) {
    $scope.user = {};
    AuthService.currentUser(function(user) {
        $scope.user = user;
    });

    $scope.logout = AuthService.logout;

    $scope.hasPermission = function(permission) {
        if (!$scope.user.scope) return false;
        return $scope.user.scope.indexOf(permission) !== -1;
    };

}]);