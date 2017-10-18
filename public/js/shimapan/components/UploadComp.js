angular.module('UploadComp', ['ngFileUpload', 'AuthSvc']).component('uploadComponent', {
    templateUrl: '/views/shimapan/upload-form.html',
    controller: ['$scope', 'Upload', '$timeout', 'AuthService', function ($scope, Upload, $timeout, AuthService) {
        $scope.errToString = function (err) {
            if (err === 'maxSize')
                return "File too large.";
            else
                return err;
        };

        $scope.uploadFiles = function (files, errorFiles) {
            $scope.files = $scope.files ? $scope.files.concat(files) : files;
            $scope.errorFiles = $scope.errorFiles ? $scope.errorFiles.concat(errorFiles) : errorFiles;

            angular.forEach(files, function (file) {
                file.upload = Upload.upload({
                    url: '/api/upload',
                    method: 'POST',
                    file: file
                });

                file.upload.then(
                    function (response) {
                        $timeout(function () {
                            file.result = response.data;
                        });
                    },
                    function (response) {
                        if (response.status !== 200) {
                            if (response.status === 401) {
                                file.$error = "Invalid authorization token";
                            } else if (response.status === 403) {
                                file.$error = "Forbidden";
                            } else {
                                file.$error = "Unknown error " + response.status;
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
    }],
    controllerAs: 'vm'
});
