const angular = require('angular');

angular.module('AuthSvc', []).service('AuthService', ['$http', '$window', function($http) {
    this.login = async (displayname, password) =>
        $http({
            method: 'POST',
            url: '/api/auth/login',
            data: {
                displayname: displayname,
                password: password
            }
        }).catch(err => {
            if (err.status === 401)
                throw 'unauthorized';
            else if (err.status === 429)
                throw 'ratelimited';
            else
                throw 'unknown';
        });

    this.logout = async () =>
        $http({
            method: 'POST',
            url: '/api/auth/logout'
        });

    this.register = async (displayname, password, invite) =>
        $http({
            method: 'POST',
            url: '/api/auth/register',
            data: {
                displayname: displayname,
                password: password,
                invite: invite
            }
        }).catch(err => {
            throw err;
        });

    this.whoami = async () =>
        $http({
            method: 'GET',
            url: '/api/auth/whoami'
        }).catch(err => {
            throw err;
        });
}]);
