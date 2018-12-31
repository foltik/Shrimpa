const angular = require('angular');

angular.module('LoginComp', ['AuthSvc']).component('loginComponent', {
    templateUrl: '/views/shimapan/login-form.html',
    controller: ['$scope', '$window', '$timeout', 'AuthService', function($scope, $window, $timeout, AuthService) {
        $scope.flash = classname => {
            $scope.$apply(() => $scope[classname] = true);
            $timeout(() => $scope[classname] = false, 820);
        };

        $scope.error = false;
        $scope.login = async () => {
            try {
                await AuthService.login($scope.username, $scope.password);
                $window.location.href = '/home';
            } catch(err) {
                if (err === 'limited')
                    $scope.flash('warn');
                else if (err === 'unauthorized')
                    $scope.flash('error');
                else
                    $scope.flash('error');
            }
        };
    }]
});