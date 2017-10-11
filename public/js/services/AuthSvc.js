angular.module('AuthSvc', []).service('AuthService', ['$http', '$window', function($http, $window) {
    function decodeToken(token) {
        if (token) {
            var payload = token.split('.')[1];
            payload = $window.atob(payload);
            payload = JSON.parse(payload);
            return payload;
        } else {
            return {};
        }
    }

    function saveToken(token) {
        $window.localStorage['shimapan-token'] = token;
    }

    function getToken() {
        return $window.localStorage['shimapan-token'];
    }

    this.login = function(user) {
        return $http({
            method: 'POST',
            url: '/api/auth/login',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: user
        }).then(function(res) {
            saveToken(res.data.token);
        })
    };
    this.logout = function() {
        $window.localStorage.removeItem('shimapan-token');
    };
    this.isLoggedIn = function() {
        var payload = decodeToken(getToken());
        return payload.exp > Date.now() / 1000;
    };

    this.register = function(user) {
        return $http({
            method: 'POST',
            url: '/api/auth/register',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: user
        }).then(function(res) {
            saveToken(res.data.token);
        });
    };

    this.currentUser = function() {
        var payload = decodeToken(getToken());
        return payload.username;
    };
}]);
