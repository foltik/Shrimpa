var angular = require('angular');

angular.module('ApiSvc', []).service('ApiService', ['$http', function ($http) {
    this.getKey = function (identifier, cb) {
        $http({
            method: 'GET',
            url: '/api/keys/get',
            params: {identifier: identifier}
        }).then(function (res) {
            cb(res.data);
        });
    };

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
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: {key: key.key}
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.createKey = function (key, cb) {
        $http({
            method: 'POST',
            url: '/api/keys/create',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: key
        }).then(function(res) {
            cb(res.data);
        });
    };
}]);
