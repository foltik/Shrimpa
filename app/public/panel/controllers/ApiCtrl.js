var angular = require('angular');

angular.module('ApiCtrl', ['ApiSvc', 'AuthSvc']).controller('ApiController', ['$scope', 'ApiService', 'AuthService', function ($scope, ApiService, AuthService) {
    function splitScope(scope) {
        var res = {};
        for (var i in scope) {
            var perm = scope[i];
            var prefix = perm.substr(0, perm.indexOf('.'));
            var postfix = perm.substr(perm.indexOf('.') + 1);
            if (!res[prefix]) res[prefix] = [];
            res[prefix].push({name: postfix});
        }
        return res;
    }

    $scope.checkCkPerm = function(prefix, perm) {
        var index = $scope.scopeObj[prefix].indexOf(perm);
        if ($scope.scopeObj[prefix][index].isChecked) {
            $scope.ckScope.push(prefix + '.' + perm.name);
        } else {
            var index = $scope.ckScope.indexOf(prefix + '.' + perm.name);
            $scope.ckScope.splice(index, 1);
        }
    };

    $scope.parseScope = function () {
        AuthService.currentUser(function (res) {
            $scope.scopeObj = splitScope(res.scope);
            $scope.ckScope = [];
        })
    };

    $scope.getKeys = function () {
        ApiService.getAll(function (keys) {
            $scope.keys = keys;
        });
    };

    $scope.hideNewKey = function () {
        $scope.nModalShow = false;
    };
    $scope.showNewKey = function () {
        $scope.nModalShow = true;
    };

    $scope.hideKeyInfo = function () {
        $scope.kModalShow = false;
    };
    $scope.showKeyInfo = function (key) {
        $scope.kModalShow = true;
        $scope.currKey = key;
        $scope.currKey.scopeObj = splitScope($scope.currKey.scope);
    };

    $scope.deleteKey = function (key) {
        ApiService.deleteKey(key, function () {
            var index = $scope.keys.indexOf(key);
            $scope.keys.splice(index, 1);
            $scope.hideKeyInfo();
            $scope.currKey = {};
        });
    };

    $scope.createKey = function () {
        if ($scope.ckScope.length === 0 || !$scope.ckIdentifier)
            return;

        ApiService.createKey({
            identifier: $scope.ckIdentifier,
            scope: JSON.stringify($scope.ckScope)
        }, function (res) {
            if (res.key) {
                $scope.hideNewKey();
                $scope.getKeys();
            }
        });
    }
}]);