const angular = require('angular');

angular.module('DashCtrl', ['chart.js', 'StatSvc']).controller('DashController', ['$scope', 'StatService', async ($scope, StatService) => {
    const colorScheme = ['#2a9fd6'];
    // Calculate and format descending dates back one week to use for x-axis labels
    const currentDate = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    let labels = Array.from({length: 7}, (date, i) =>
        (new Date(currentDate - oneDay * (6 - i))).toISOString().substr(5, 5));

    const toHumanReadable = bytes => {
        const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
        let index = 0;
        for(; bytes >= 1024 && index < units.length - 1; index++)
            bytes /= 1024;
        return bytes.toFixed(3) + ' ' + units[index];
    };

    // Get stats for the week
    $scope.statWeekUploads = 0;
    $scope.statWeekUploadSize = 0;
    $scope.statWeekViews = 0;

    const weekStats = await StatService.getWeek();
    console.log(weekStats);

    $scope.uploadData = [Array.from({length: 7}, (val, i) => weekStats[labels[i]] && weekStats[labels[i]].uploads ? weekStats[labels[i]].uploads : 0)];
    $scope.viewData = [Array.from({length: 7}, (val, i) => weekStats[labels[i]] && weekStats[labels[i]].views ? weekStats[labels[i]].views : 0)];

    $scope.statWeekUploads = Object.keys(weekStats).reduce((acc, key) => acc + (weekStats[key].uploads ? weekStats[key].uploads : 0), 0);
    $scope.statWeekUploadSize = toHumanReadable(Object.keys(weekStats).reduce((acc, key) => acc + (weekStats[key].size ? weekStats[key].size : 0), 0));
    $scope.statWeekViews = Object.keys(weekStats).reduce((acc, key) => acc + (weekStats[key].views ? weekStats[key].views : 0), 0);

    // Get all-time stats
    $scope.statTotalUploads = 0;
    $scope.statTotalUploadSize = 0;
    $scope.statTotalViews = 0;
    const allStats = await StatService.getAll();
    console.log(allStats);
    $scope.statTotalUploads = allStats.count;
    $scope.statTotalUploadSize = toHumanReadable(allStats.size);
    $scope.statTotalViews = allStats.views;

    $scope.uploadColors = colorScheme;
    $scope.uploadLabels = labels;
    $scope.uploadSeries = ['Uploads'];
    //$scope.uploadData = [[5, 11, 4, 3, 7, 9, 21]];
    $scope.uploadOptions = {
        title: {
            display: true,
            text: 'Historical Uploads'
        },
    };

    $scope.viewColors = colorScheme;
    $scope.viewLabels = labels;
    $scope.viewSeries = ['Views'];
    //$scope.viewData = [[5, 11, 4, 3, 7, 9, 21]];
    $scope.viewOptions = {
        title: {
            display: true,
            text: 'Historical Views'
        }
    };
}]);