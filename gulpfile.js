var gulp   = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var jsFiles = 'public/js/**/*.js',
	jsDest  = 'public/libs/app';

gulp.task('concat', function() {
	return gulp.src(jsFiles)
		.pipe(concat('app.js'))
		.pipe(gulp.dest(jsDest));
});
