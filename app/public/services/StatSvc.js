const angular = require('angular');

angular.module('StatSvc', []).service('StatService', ['$http', function($http) {
    this.getUploads = async () => {
        const res = await $http({
            method: 'GET',
            url: '/api/stats/uploads'
        });

        return res.data;
    };

    this.getUploadsWeek = async () => {
        let oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const res = await $http({
            method: 'GET',
            url: '/api/stats/uploads',
            data: {
                after: oneWeekAgo
            }
        });

        return res.data;
    };

    this.getViews = async () => {
        const res = await $http({
            method: 'GET',
            url: '/api/stats/views'
        });

        return res.data;
    };

    this.getViewsWeek = async () => {
        let oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const res = await $http({
            method: 'GET',
            url: '/api/stats/uploads'
        });

        return res.data;
    };
}]);
