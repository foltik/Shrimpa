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
}]);
