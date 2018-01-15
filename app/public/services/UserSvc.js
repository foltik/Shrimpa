var angular = require('angular');

angular.module('UserSvc', []).service('UserService', ['$http', function($http) {
    this.getUser = function(username, cb) {
        $http({
            method: 'GET',
            url: '/api/users/get',
            params: {username: username}
        }).then(function(res) {
            cb(res.data);
        });
    };

    this.getAllUsers = function(cb) {
        $http({
            method: 'GET',
            url: '/api/users/get'
        }).then(function(res) {
            cb(res.data);
        });
    };
}]);