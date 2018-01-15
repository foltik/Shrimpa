var angular = require('angular');

angular.module('UserCtrl', ['UserSvc']).controller('UserController', ['$scope', 'UserService', function($scope, UserService) {
    $scope.getUsers = function() {
        UserService.getAllUsers(function(users) {
            $scope.users = users;
        });
    };
}]);