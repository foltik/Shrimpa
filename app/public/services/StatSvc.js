var angular = require('angular');

angular.module('StatSvc', []).service('StatService', ['$http', function($http) {
    this.getWeek = cb =>
        $http({
            method: 'GET',
            url: '/api/stats/week'
        }).then(res => {
            cb(null, res.data)
        }).catch(err => {
            cb(err);
        });

    this.getAll = cb =>
        $http({
            method: 'GET',
            url: '/api/stats/all'
        }).then(res => {
            cb(null, res.data[0])
        }).catch(err => {
            cb(err);
        });
}]);
