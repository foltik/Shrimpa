var gulp   = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('js', function() {
    gulp.start('shimapan');
    gulp.start('shimapan-panel');
});

gulp.task('shimapan', function() {
	return gulp.src([
	    'public/js/services/*.js',
        'public/js/shimapan/**/*.js'
    ])
		.pipe(concat('shimapan.min.js'))
		.pipe(uglify())
        .pipe(gulp.dest('public/libs/app'));
});

gulp.task('shimapan-panel', function() {
    return gulp.src([
        'public/js/services/*.js',
        'public/js/shimapan-panel/**/*.js'
    ])
        .pipe(concat('shimapan-panel.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/libs/app'));
});
