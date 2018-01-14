var angular = require('angular');

angular.module('InviteCtrl', ['InviteSvc', 'AuthSvc']).controller('InviteController', ['$scope', 'InviteService', 'AuthService', function($scope, InviteService, AuthService) {
    // Transforms an array of period-separated properties ex. ["file.upload", "user.view", "user.ban"]
    // to json ex. { "file": "upload", "user": ["view", "ban"] }
    function splitScope(scope) {
        var res = {};
        for (var i in scope) {
            if (scope.hasOwnProperty(i)) {
                var perm = scope[i];
                var prefix = perm.substr(0, perm.indexOf('.'));
                var postfix = perm.substr(perm.indexOf('.') + 1);
                if (!res[prefix])
                    res[prefix] = [];
                res[prefix].push({name: postfix});
            }
        }
        return res;
    }

    // Called on init, retrieves the user's scope from the server.
    $scope.parseScope = function () {
        AuthService.currentUser(function (res) {
            $scope.scopeObj = splitScope(res.scope);
            $scope.currInvScope = [];
        })
    };

    // Triggered when a checkbox for a permission changes.
    // Updates the currInvScope object with the addition or removal.
    $scope.updateCurrInvPerm = function(prefix, perm) {
        var index = $scope.scopeObj[prefix].indexOf(perm);
        if ($scope.scopeObj[prefix][index].isChecked) {
            $scope.currInvScope.push(prefix + '.' + perm.name);
        } else {
            index = $scope.currInvScope.indexOf(prefix + '.' + perm.name);
            $scope.currInvScope.splice(index, 1);
        }
    };

    $scope.getInvites = function() {
        InviteService.getAllInvites(function(invites) {
           $scope.invites = invites;
        });
    };

    $scope.deleteInvite = function(invite) {
        InviteService.deleteInvite(function() {
            var index = $scope.invites.indexOf(invite);
            $scope.invites.splice(index, 1);
        });
    };

    $scope.createInvite = function() {
        InviteService.createInvite({
            scope: JSON.stringify($scope.currInvScope),
            exp: JSON.stringify($scope.currInvExpiry)
        }, function(res) {
            if (res.code) {
                $scope.getInvites();
            }
        });
    };
}]);