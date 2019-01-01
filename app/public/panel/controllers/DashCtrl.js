const angular = require('angular');

angular.module('DashCtrl', ['chart.js', 'StatSvc']).controller('DashController', ['$scope', 'StatService', async ($scope, StatService) => {
    const toHumanReadable = bytes => {
        const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
        let index = 0;
        for(; bytes >= 1024 && index < units.length - 1; index++)
            bytes /= 1024;
        return bytes.toFixed(3) + ' ' + units[index];
    };


    const getWeekUploadStats = async () => {
        const stats = await StatService.getUploadsWeek();
        console.log(stats);
        $scope.statWeekUploads = stats.length;
        $scope.statWeekUploadSize = toHumanReadable(stats.reduce((acc, stat) => acc + stat.size, 0));
    };

    const getWeekViewStats = async () => {
        const stats = await StatService.getViewsWeek();
        $scope.statWeekViews = stats.length;
    };

    const getAllUploadStats = async () => {
        const stats = await StatService.getUploads();
        console.log(stats);
        $scope.statTotalUploads = stats.length;
        $scope.statTotalUploadSize = toHumanReadable(stats.reduce((acc, stat) => acc + stat.size, 0));
    };

    const getAllViewStats = async () => {
        const stats = await StatService.getViews();
        $scope.statTotalViews = stats.length;
    };


    await Promise.all([getWeekUploadStats(), getWeekViewStats(), getAllUploadStats(), getAllViewStats()]);
    $scope.$apply();
}]);