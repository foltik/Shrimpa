var angular = require('angular');

angular.module('NavCtrl', ['AuthSvc']).controller('NavController', ['$scope', '$window', 'AuthService', function($scope, $window, AuthService) {
    $scope.user = {};
    AuthService.currentUser(function(user) {
        $scope.user = username;
    });

    $scope.logout = AuthService.logout;

    $scope.hasPermission = function(permission) {
        return ($scope.user && $scope.user.scope &&
            $scope.user.scope.indexOf(permission) !== -1);
    };
}]);