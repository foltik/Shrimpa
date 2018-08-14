var angular = require('angular');

angular.module('KeySvc', []).service('KeyService', ['$http', function($http) {
    this.createKey = (identifier, scope, cb) =>
        $http({
            method: 'POST',
            url: '/api/keys/create',
            data: {
                identifier: identifier,
                scope: scope
            }
        }).then(res => {
            cb(null, res.data)
        }).catch(err => {
            cb(err);
        });

    this.deleteKey = (key, cb) =>
        $http({
            method: 'POST',
            url: '/api/keys/delete',
            data: {
                key: key
            }
        }).then(res => {
            cb(null, res.data);
        }).catch(err => {
            cb(err);
        });

    this.getAllKeys = cb =>
        $http({
            method: 'GET',
            url: '/api/keys/get'
        }).then(res => {
            cb(null, res.data);
        }).catch(err => {
            cb(err);
        });
}]);
