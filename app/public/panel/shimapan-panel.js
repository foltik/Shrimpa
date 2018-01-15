var angular = require('angular');
var uirouter = require('angular-ui-router');
var app = angular.module('shimapan-panel', ['ui.router', 'AuthSvc', 'ApiSvc', 'InviteSvc', 'UserSvc', 'ApiCtrl', 'InviteCtrl', 'UserCtrl', 'NavCtrl', 'PanelRoutes']);

app.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);