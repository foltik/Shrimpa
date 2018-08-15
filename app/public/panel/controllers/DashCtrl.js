var angular = require('angular');

angular.module('DashCtrl', ['chart.js']).controller('DashController', ['$scope', $scope => {
    $scope.uploadColors = ['#2a9fd6'];
    $scope.uploadLabels = ["January", "February", "March", "April", "May", "June", "July"];
    $scope.uploadSeries = ['Uploads'];
    $scope.uploadData = [[65, 59, 80, 81, 56, 55, 40]];
    $scope.uploadDatasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
    $scope.uploadOptions = {
        scales: {
            yAxes: [
                {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left'
                }
            ]
        }
    };


}]);