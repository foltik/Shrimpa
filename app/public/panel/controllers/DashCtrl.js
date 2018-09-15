var angular = require('angular');

angular.module('DashCtrl', ['chart.js']).controller('DashController', ['$scope', $scope => {
    const colorScheme = ['#2a9fd6'];

    // Calculate and format descending dates back one week
    const currentDate = new Date();
    const oneDay = 1000 * 60 * 60 * 24;
    let dates = Array.from({length: 7}, (date, i) => new Date(currentDate - oneDay * (6 - i)));
    let labels = dates.map(date => date.toISOString().substr(5, 5));

    $scope.uploadColors = colorScheme;
    $scope.uploadLabels = labels;
    $scope.uploadSeries = ['Uploads'];
    $scope.uploadData = [[10, 20, 30, 20, 15, 20, 45]];
    $scope.uploadOptions = {
        title: {
            display: true,
            text: 'Historical Uploads'
        },
    };

    $scope.viewColors = colorScheme;
    $scope.viewLabels = labels;
    $scope.viewSeries = ['Views'];
    $scope.viewData = [[5, 11, 4, 3, 7, 9, 21]];
    $scope.viewOptions = {
        title: {
            display: true,
            text: 'Historical Views'
        }
    };
}]);
{
}