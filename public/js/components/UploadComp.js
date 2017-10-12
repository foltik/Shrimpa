function UploadController($scope, Upload, $timeout, AuthService) {
    $scope.errToString = function(err) {
        if (err === 'maxSize')
            return "File too large.";
        else
            return err;
    };

    $scope.uploadFiles = function(files, errorFiles) {
        $scope.files =      $scope.files      ? $scope.files.concat(files)           : files;
        $scope.errorFiles = $scope.errorFiles ? $scope.errorFiles.concat(errorFiles) : errorFiles;

        angular.forEach(files, function (file) {
            file.upload = Upload.upload({
                url: '/api/upload',
                method: 'POST',
                headers: {
                    'Authorization': AuthService.getAuthHeader()
                },
                file: file
            });

            file.upload.then(
                function (response) {
                    $timeout(function () {
                        file.result = response.data;
                    });
                },
                function (response) {
                    if (response.status > 0) {
                        if (response.status === 401) {
                            file.$error = "Invalid authorization token.";
                        } else {
                            file.$error = "Internal server error.";
                        }
                        var index = $scope.files.indexOf(file);
                        $scope.errorFiles.push(file);
                        $scope.files.splice(index, 1);
                    }
                },
                function (evt) {
                    file.progress = Math.floor(Math.min(100.0, 100 * evt.loaded / evt.total));
                }
            );
        });
    };
}

angular.module('UploadComp', ['ngFileUpload', 'AuthSvc']).component('uploadComponent', {
    templateUrl: '/views/upload-form.html',
    controller: UploadController,
    controllerAs: 'vm'
});
