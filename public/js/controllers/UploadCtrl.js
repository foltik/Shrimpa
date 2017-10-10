angular.module('UploadCtrl', ['ngFileUpload']).controller('UploadController', ['$scope', 'Upload', '$timeout', function ($scope, Upload, $timeout) {
    $scope.uploadFiles = function (files, errorFiles) {
        if (!$scope.files)
            $scope.files = files;
        else
            $scope.files = $scope.files.concat(files);

        $scope.errorFiles = errorFiles;

        angular.forEach(files, function (file) {
            file.upload = Upload.upload({
                url: '/upload',
                method: 'POST',
                // data: loginToken, unique id, something
                file: file
            });

            file.upload.then(
                function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                },
                function (response) {
                    if (response.status > 0)
                        $scope.errorMsg = response.status + ': ' + response.data;
                },
                function (evt) {
                    file.progress = Math.floor(Math.min(100.0, 100 * evt.loaded / evt.total));
                }
            );
        });
    };
}]);