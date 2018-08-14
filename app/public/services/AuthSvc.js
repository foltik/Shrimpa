var angular = require('angular');

angular.module('AuthSvc', []).service('AuthService', ['$http', '$window', function($http, $window) {
    this.login = (displayname, password) => {
        return $http({
            method: 'POST',
            url: '/api/auth/login',
            data: {
                displayname: displayname,
                password: password
            }
        }).then(res => {
            if (res.status === 200)
                $window.location.href = '/home';
        })
    };

    this.logout = () => {
        $http({
            method: 'GET',
            url: '/api/auth/logout'
        }).then(() => {
            $window.location.href = '/';
        });
    };

    this.register = (displayname, password, invite) => {
        return $http({
            method: 'POST',
            url: '/api/auth/register',
            data: {
                displayname: displayname,
                password: password,
                invite: invite
            }
        }).then(function(res) {
            if (res.status === 200)
                $window.location.href = '/home';
        });
    };

    this.whoami = function(cb) {
        return $http({
            method: 'GET',
            url: '/api/auth/whoami'
        }).then(function(res) {
            cb(res.data);
        });
    }
}]);
