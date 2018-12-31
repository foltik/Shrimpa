const angular = require('angular');

angular.module('StatSvc', []).service('StatService', ['$http', function($http) {
    this.getWeek = async () => {
        const res = await $http({
            method: 'GET',
            url: '/api/stats/week'
        });

        return res.data;
    };

    this.getAll = async () => {
        const res = await $http({
            method: 'GET',
            url: '/api/stats/all'
        });

        return res.data;
    }
}]);
