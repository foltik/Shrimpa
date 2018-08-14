var angular = require('angular');

angular.module('KeySvc', []).service('KeyService', ['$http', function ($http) {
    this.getAllKeys = function (cb) {
        $http({
            method: 'GET',
            url: '/api/keys/get'
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.deleteKey = function (key, cb) {
        $http({
            method: 'POST',
            url: '/api/keys/delete',
            data: {
                key: key
            }
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.createKey = function (identifier, scope, cb) {
        $http({
            method: 'POST',
            url: '/api/keys/create',
            data: {
                identifier: identifier,
                scope: scope
            }
        }).then(function(res) {
            cb(res.data);
        });
    };
}]);
