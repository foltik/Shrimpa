var app = angular.module('shimapan-panel', ['ui.router', 'AuthSvc', 'ApiSvc', 'ApiCtrl', 'NavCtrl', 'PanelRoutes']);

app.run(['$rootScope', '$state', '$stateParams', function($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);