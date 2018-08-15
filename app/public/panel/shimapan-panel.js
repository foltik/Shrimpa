var angular = require('angular');
var uirouter = require('angular-ui-router');
var chart = require('angular-chart.js');
var app = angular.module('shimapan-panel', ['ui.router', 'AuthSvc', 'KeySvc', 'InviteSvc', 'UserSvc', 'KeyCtrl', 'InviteCtrl', 'UserCtrl', 'NavCtrl', 'DashCtrl', 'PanelRoutes']);

app.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);