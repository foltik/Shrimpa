var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var evstream = require('event-stream');
var cleanCSS = require('gulp-clean-css');
var nodemon = require('gulp-nodemon');
var path = require('path');

gulp.task('start', function () {
    nodemon({
        script: 'server.js',
        ext: 'js html css',
        env: {'NODE_ENV': 'dev'},
        tasks: function (changedFiles) {
            var tasks = [];
            changedFiles.forEach(function (file) {
                if (path.extname(file) === '.js' && !~tasks.indexOf('minjs'))
                    tasks.push('minjs');
                if (path.extname(file) === '.css' && !~tasks.indexOf('mincss'))
                    tasks.push('mincss');
            });
            return tasks;
        }
    }).on('restart?', function () {
        gulp.start('default');
    });
});

gulp.task('default', function () {
    gulp.start('minjs');
    gulp.start('mincss');
});

gulp.task('mincss', function () {
    var files = [
        {
            src: 'public/css/form.css',
            name: 'form.min.css'
        },
        {
            src: 'public/css/home.css',
            name: 'home.min.css'
        },
        {
            src: 'public/css/panel.css',
            name: 'panel.min.css'
        },
        {
            src: 'public/css/index.css',
            name: 'index.min.css'
        }
    ];

    var tasks = files.map(function (entry) {
        return gulp.src(entry.src)
            .pipe(cleanCSS())
            .pipe(rename(entry.name))
            .pipe(gulp.dest('public/css'));
    });

    return evstream.merge.apply(null, tasks);
})

gulp.task('minjs', function () {
    gulp.start('concatjs');
    gulp.start('browserify');
});

gulp.task('concatjs', function () {
    var files = [
        {
            src: [
                'public/js/services/*.js',
                'public/js/shimapan-panel/**/*.js'
            ],
            name: 'panel.min.js'
        },
        {
            src: [
                'public/js/services/*.js',
                'public/js/shimapan/**/*.js'
            ],
            name: 'shimapan.min.js'
        }
    ];

    var tasks = files.map(function (entry) {
        return gulp.src(entry.src)
            .pipe(concat(entry.name))
            .pipe(uglify())
            .pipe(gulp.dest('public/libs/app'));
    });

    return evstream.merge.apply(null, tasks);
})

gulp.task('browserify', ['concatjs'], function () {
    var files = [
        {
            src: 'public/libs/app/shimapan.min.js',
            name: 'shimapan.bundle.js'
        },
        {
            src: 'public/libs/app/panel.min.js',
            name: 'panel.bundle.js'
        }
    ];

    var tasks = files.map(function (entry) {
        return browserify({entries: [entry.src]})
            .bundle()
            .pipe(source(entry.src))
            .pipe(rename(entry.name))
            .pipe(gulp.dest('public/libs/app'));
    });

    return evstream.merge.apply(null, tasks);
});
