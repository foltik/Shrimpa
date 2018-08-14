'use strict';

const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
//const uglify = require('gulp-uglify');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const es = require('event-stream');
const cleanCSS = require('gulp-clean-css');
const nodemon = require('gulp-nodemon');
const path = require('path');

gulp.task('start', (done) => {
    nodemon({
        script: 'server.js',
        ignore: '*.*'
    });
    done();
});

gulp.task('watch', (done) => {
    nodemon({
        script: 'server.js',
        ext: 'js html css',
        env: {'NODE_ENV': 'dev'},
        watch: [
            'app/',
            'config/'
        ],
        tasks: function (changedFiles) {
            var tasks = [];
            changedFiles.forEach(function (file) {
                if (path.extname(file) === '.js' && !~tasks.indexOf('MakeJS'))
                    tasks.push('MakeJS');
                if (path.extname(file) === '.css' && !~tasks.indexOf('MakeCSS'))
                    tasks.push('MakeCSS');
            });
            return tasks;
        }
    }).on('restart?', function () {
        gulp.task('default')();
    });
});

gulp.task('MinifyCSS', () => {
    const files = [
        {
            src: 'app/public/css/form.css',
            dest: 'form.min.css'
        },
        {
            src: 'app/public/css/home.css',
            dest: 'home.min.css'
        },
        {
            src: 'app/public/css/panel.css',
            dest: 'panel.min.css'
        },
        {
            src: 'app/public/css/index.css',
            dest: 'index.min.css'
        }
    ];

    const tasks = files.map(file =>
        gulp.src(file.src)
            .pipe(cleanCSS())
            .pipe(rename(file.dest))
            .pipe(gulp.dest('public/css')));

    return es.merge(tasks)
        .pipe(gulp.dest('public/css'));
});

gulp.task('MinifyJS', () => {
    const files = [
        {
            src: [
                'app/public/services/*.js',
                'app/public/panel/**/*.js'
            ],
            dest: 'panel.min.js'
        },
        {
            src: [
                'app/public/services/*.js',
                'app/public/shimapan/**/*.js'
            ],
            dest: 'shimapan.min.js'
        },
        {
            src: 'app/public/index/*.js',
            dest: 'index.min.js'
        }
    ];

    const tasks = files.map(file =>
        gulp.src(file.src)
            .pipe(concat(file.dest))
            .pipe(uglify())
    );

    return es.merge(tasks)
        .pipe(gulp.dest('public/js'));
});

gulp.task('BrowserifyJS', () => {
    const files = [
        {
            src: 'public/js/shimapan.min.js',
            dest: 'shimapan.bundle.js'
        }, {
            src: 'public/js/panel.min.js',
            dest: 'panel.bundle.js'
        }
    ];

    const tasks = files.map(entry =>
        browserify({entries: [entry.src], debug: true}).bundle()
            .pipe(source(entry.dest))
    );

    return es.merge(tasks)
        .pipe(gulp.dest('public/js'));
});

gulp.task('MakeJS', gulp.series('MinifyJS', 'BrowserifyJS'));
gulp.task('MakeCSS', gulp.series('MinifyCSS'));

gulp.task('default', gulp.parallel('MakeJS', 'MakeCSS'));
