var angular = require('angular');

angular.module('DashCtrl', ['chart.js']).controller('DashController', ['$scope', $scope => {
    const colorScheme = ['#2a9fd6'];

    let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for(let i = 0; i < 6 - (new Date()).getDay(); i++) {
        const back = weekDays.pop();
        weekDays.unshift(back);
    }

    $scope.uploadColors = colorScheme;
    $scope.uploadLabels = weekDays;
    $scope.uploadSeries = ['Uploads'];
    $scope.uploadData = [[10, 20, 30, 20, 15, 20, 45]];
    $scope.uploadOptions = {
        title: {
            display: true,
            text: 'Historical Uploads'
        },
    };

    $scope.viewColors = colorScheme;
    $scope.viewLabels = weekDays;
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