var angular = require('angular');

angular.module('ApiSvc', []).service('ApiService', ['$http', '$window', function ($http, $window) {
    this.getKey = function (identifier, cb) {
        $http({
            method: 'GET',
            url: '/api/keys/get',
            params: {identifier: identifier}
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.getAll = function (cb) {
        $http({
            method: 'GET',
            url: '/api/keys/get'
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.deleteKey = function(key, cb) {
        $http({
            method: 'POST',
            url: '/api/keys/delete',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: {key: key.key}
        }).then(function(res) {
            cb(res.data);
        });
    }
}]);
