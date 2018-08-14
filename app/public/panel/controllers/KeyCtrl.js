var angular = require('angular');

angular.module('KeyCtrl', ['KeySvc', 'AuthSvc']).controller('ApiController', ['$scope', 'KeyService', 'AuthService', function ($scope, KeyService, AuthService) {
    // Transforms an array of period-separated properties ex. ["file.upload", "user.view", "user.ban"]
    // to json ex. { "file": "upload", "user": ["view", "ban"] }
    function splitScope(scope) {
        var res = {};
        for (var i in scope) {
            if (scope.hasOwnProperty(i)) {
                var perm = scope[i];
                var prefix = perm.substr(0, perm.indexOf('.'));
                var postfix = perm.substr(perm.indexOf('.') + 1);
                if (!res[prefix]) res[prefix] = [];
                res[prefix].push({name: postfix});
            }
        }
        return res;
    }

    // Called on init, retrieves the user's scope from the server.
    $scope.parseScope = function () {
        AuthService.whoami(function (res) {
            $scope.scopeObj = splitScope(res.scope);
            $scope.currKeyScope = [];
        })
    };

    // Triggered when a checkbox for a permission changes.
    // Updates the currKeyScope object with the addition or removal.
    $scope.updateCurrKeyPerm = function(prefix, perm) {
        var index = $scope.scopeObj[prefix].indexOf(perm);
        if ($scope.scopeObj[prefix][index].isChecked) {
            $scope.currKeyScope.push(prefix + '.' + perm.name);
        } else {
            index = $scope.currKeyScope.indexOf(prefix + '.' + perm.name);
            $scope.currKeyScope.splice(index, 1);
        }
    };

    $scope.getKeys = function () {
        KeyService.getAllKeys(function (keys) {
            $scope.keys = keys;
        });
    };

    $scope.deleteKey = function (key) {
        KeyService.deleteKey(key, function () {
            var index = $scope.keys.indexOf(key);
            $scope.keys.splice(index, 1);
            $scope.hideKeyInfo();
            $scope.currKey = {};
        });
    };

    $scope.createKey = function () {
        if ($scope.currKeyScope.length === 0 || !$scope.currKeyIdentifier)
            return;

        KeyService.createKey($scope.currKeyIdentifier, $scope.currKeyScope,
            function (res) {
            if (res.key) {
                $scope.hideNewKey();
                $scope.getKeys();
            }
        });
    };

    // Hide/show new key modal dialog
    $scope.hideNewKey = function () {
        $scope.nModalShow = false;
    };
    $scope.showNewKey = function () {
        $scope.nModalShow = true;
    };

    // Hide/show key info modal dialog
    $scope.hideKeyInfo = function () {
        $scope.kModalShow = false;
    };
    $scope.showKeyInfo = function (key) {
        $scope.kModalShow = true;
        $scope.currKey = key;
        $scope.currKey.scopeObj = splitScope($scope.currKey.scope);
    };
}]);