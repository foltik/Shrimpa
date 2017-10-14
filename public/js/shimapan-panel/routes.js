angular.module('PanelRoutes', ['ui.router']).config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $urlRouterProvider.otherwise('/panel');

    $stateProvider
        .state('/panel', {
            url: '/panel',
            templateUrl: '/views/shimapan-panel/panel-home.html'
        }).state('/panel/api', {
        url: '/panel/api',
            templateUrl: '/views/shimapan-panel/panel-api.html'
        });
}]);