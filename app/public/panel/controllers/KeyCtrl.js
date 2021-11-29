var angular = require('angular');

angular.module('KeyCtrl', ['KeySvc', 'AuthSvc']).controller('KeyController', ['$scope', 'KeyService', 'AuthService', function($scope, KeyService, AuthService) {
    // Transforms an array of period-separated properties ex. ["file.upload", "user.view", "user.ban"]
    // to json ex. {"file": "upload", "user": ["view", "ban"]}
    function scopeToObj(scope) {
        const res = {};
        for(const prop in scope) {
            if (scope.hasOwnProperty(prop)) {
                const perm = scope[prop];
                const prefix = perm.substr(0, perm.indexOf('.'));
                const postfix = perm.substr(perm.indexOf('.') + 1);
                if (!res[prefix]) res[prefix] = [];
                res[prefix].push({name: postfix});
            }
        }
        return res;
    }

    $scope.init = () => {
        AuthService.whoami(res => {
            $scope.scope = scopeToObj(res.scope);
            $scope.displayname = res.displayname;
        });
        $scope.getAllKeys();
        $scope.newScope = [];
    };


    // ------------ Keys ------------ ///
    class Key {
        constructor(identifier, scope, key) {
            this.identifier = identifier;
            this.scope = scopeToObj(scope);
            this.key = key;
        }
    }
    $scope.getAllKeys = () =>
        KeyService.getAllKeys((err, res) =>
            $scope.keys = res.map(key => new Key(key.identifier, key.scope, key.key)));
    $scope.createKey = () =>
        KeyService.createKey($scope.newIdentifier, $scope.newScope, (err, res) => {
            if (err) return;
            $scope.hideNewKey();
            $scope.getAllKeys();
        });
    $scope.deleteKey = key =>
        KeyService.deleteKey(key.key, (err, res) => {
            if (err) return;
            $scope.keys.splice($scope.keys.indexOf(key), 1);
            $scope.hideKeyInfo();
            $scope.currKey = {};
        });

    // Triggered when a checkbox for a permission changes.
    // Updates the currKeyScope object with the addition or removal.
    $scope.updateNewScope = function(prefix, perm) {
        // If the checkbox was checked
        if ($scope.scope[prefix][$scope.scope[prefix].indexOf(perm)].isChecked) {
            $scope.newScope.push(prefix + '.' + perm.name);
        } else {
            // Otherwise it was unchecked, remove it
            $scope.newScope.splice($scope.newScope.indexOf(prefix + '.' + perm.name), 1);
        }
    };

    // Hide/show new key modal dialog
    $scope.hideNewKey = () => $scope.newModalStyle = {};
    $scope.showNewKey = () => $scope.newModalStyle = {display: 'block'};

    // Hide/show key info modal dialog
    $scope.hideKeyInfo = () => $scope.infoModalStyle = {};
    $scope.showKeyInfo = key => {
        $scope.currKey = key;
        $scope.infoModalStyle = {display: 'block'};
    };

    function downloadData(mime, filename, data) {
        const dataStr = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(data);
        const anchor = document.createElement('a');
        anchor.setAttribute('href', dataStr);
        anchor.setAttribute('download', filename);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    $scope.downloadBash = () => {
        const data =
            '#!/bin/bash\n' +
            'curl \\\n' +
            '  -F key=' + $scope.currKey.key + ' \\\n' +
            '  -F "file=@$1" \\\n' +
            '  https://shrimpa.rocks/api/upload \\\n' +
            '  | grep -Po \'"\'"url"\'"\\s*:\\s*"\\K([^"]*)\'\n';
        downloadData('text/x-shellscript', 'shrimpa.rocks.sh', data);
    };

    $scope.downloadSharex = () => {
        const data = {
            RequestURL: 'https://shrimpa.rocks/api/upload',
            FileFormName: 'file',
            Arguments: {
                key: $scope.currKey.key
            },
            URL: '$json:url$'
        };
        downloadData('text/json', 'shrimpa.rocks.sxcu', JSON.stringify(data));
    };
}]);