var angular = require('angular');

angular.module('AuthSvc', []).service('AuthService', ['$http', '$window', function($http, $window) {
    this.login = function(user) {
        return $http({
            method: 'POST',
            url: '/api/auth/login',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: user
        }).then(function(res) {
            if (res.status === 200)
                $window.location.href = '/home';
        })
    };

    this.logout = function() {
        $http({
            method: 'GET',
            url: '/api/auth/logout'
        }).then(function() {
            $window.location.href = '/';
        });
    };

    this.register = function(user) {
        return $http({
            method: 'POST',
            url: '/api/auth/register',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: user
        }).then(function(res) {
            if (res.status === 200)
                $window.location.href = '/home';
        });
    };

    this.currentUser = function(cb) {
        return $http({
            method: 'GET',
            url: '/api/auth/session',
            headers: {'Content-Type': 'application/json'}
        }).then(function(res) {
            cb(res.data);
        });
    }
}]);
