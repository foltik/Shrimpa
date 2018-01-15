var angular = require('angular');

angular.module('InviteSvc', []).service('InviteService', ['$http', function ($http) {
    this.getInvite = function (code, cb) {
        $http({
            method: 'GET',
            url: '/api/invites/get',
            params: {code: code}
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.getAllInvites = function (cb) {
        $http({
            method: 'GET',
            url: '/api/invites/get'
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.deleteInvite = function (invite, cb) {
        $http({
            method: 'POST',
            url: '/api/invites/delete',
            headers: {'Content-Type': 'application/x-www-form-urlencode'},
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: {code: invite.code}
        }).then(function (res) {
            cb(res.data);
        });
    };

    this.createInvite = function (invite, cb) {
        $http({
            method: 'POST',
            url: '/api/invites/create',
            headers: {'Content-Type': 'application/x-www-form-urlencode'},
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    if (obj.hasOwnProperty(p))
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            },
            data: invite
        }).then(function(res) {
            cb(res.data);
        });
    };
}]);