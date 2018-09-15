var angular = require('angular');

angular.module('DashCtrl', ['chart.js', 'StatSvc']).controller('DashController', ['$scope', 'StatService', async ($scope, StatService) => {
    const colorScheme = ['#2a9fd6'];
    // Calculate and format descending dates back one week to use for x-axis labels
    const currentDate = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    let labels = Array.from({length: 7}, (date, i) =>
        (new Date(currentDate - oneDay * (6 - i))).toISOString().substr(5, 5));

    StatService.getWeek((err, stats) => {
        $scope.uploadData = [Array.from({length: 7}, (val, i) => stats[labels[i]] ? stats[labels[i]].uploads : 0)];
        $scope.viewData = [Array.from({length: 7}, (val, i) => stats[labels[i]] ? stats[labels[i]].views : 0)];

        $scope.stats = stats;

        $scope.statUploads = Object.keys(stats).reduce((acc, key) => acc + stats[key].uploads);
        $scope.statUploadSize = Object.keys(stats).reduce((acc, key) => acc + stats[key].size);
        $scope.statViews = Object.keys(stats).reduce((acc, key) => acc + stats[key].views);
    });

    StatService.getAll((err, stats) => {
        $scope.statTotalUploads = stats.count;
        $scope.statTotalUploadSize = stats.size;
        $scope.statTotalViews = stats.views;
    });

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