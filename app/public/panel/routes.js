var angular = require('angular');

angular.module('PanelRoutes', ['ui.router']).config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $urlRouterProvider.otherwise('/panel');

    $stateProvider
        .state('dashboard', {
            url: '/panel',
            templateUrl: '/views/panel/dash.html'
        }).state('search', {
            url: '/panel/search',
            templateUrl: '/views/panel/search.html'
        }).state('api', {
            url: '/panel/api',
            templateUrl: '/views/panel/api.html'
        }).state('invites', {
            url: '/panel/invites',
            templateUrl: '/views/panel/invites.html'
        }).state('stats', {
            url: '/panel/stats',
            templateUrl: '/views/panel/stats.html'
        }).state('users', {
            url: '/panel/users',
            templateUrl: '/views/panel/users.html'
        }).state('home', {
            onEnter: ['$window', function($window) {
                $window.location.href = '/home';
            }]
        });
}]);