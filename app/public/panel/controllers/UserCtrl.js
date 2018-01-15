var angular = require('angular');

angular.module('UserCtrl', ['UserSvc']).controller('UserController', ['$scope', 'UserService', function($scope, UserService) {
    $scope.getUsers = function() {
        UserService.getAllUsers(function(users) {
            $scope.users = users;
        });
    };

    $scope.shorten = function(size) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        var currUnit = 0;

        var num = parseFloat(size);
        for (i = 0; i < units.length; i++) {
            if (num / 1000 >= 1 && currUnit < units.length - 1) {
                currUnit++;
                num /= 1000;
            } else {
                // Round to 2 decimal places
                return Number(Math.round(num + 'e1')+'e-1') + ' ' +
                    units[currUnit];
            }
        }
    }
}]);