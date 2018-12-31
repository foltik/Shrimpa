'use strict';

const gulp = require('gulp');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const es = require('event-stream');
const cleanCSS = require('gulp-clean-css');
const nodemon = require('gulp-nodemon');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const glob = require('glob');

gulp.task('start', done => {
    nodemon({
        script: 'server.js',
        ignore: '*.*'
    });
    done();
});

gulp.task('watch', () => {
    const fileTasks = new Map([
        ['.js', 'BuildJS'],
        ['.css', 'BuildCSS']
    ]);

    nodemon({
        script: 'server.js',
        ext: 'js css',
        env: {'NODE_ENV': 'dev'},
        watch: [
            'app/',
            'config/'
        ],
        tasks: changedFiles =>
            changedFiles
                .map(file => fileTasks.get(path.extname(file)))
                .filter((value, index, self) => self.indexOf(value) === index)
    }).on('restart?', 'default')
});

gulp.task('BuildCSS', () => {
    const files = [{
        src: 'app/public/css/form.css',
        dest: 'form.min.css'
    }, {
        src: 'app/public/css/home.css',
        dest: 'home.min.css'
    }, {
        src: 'app/public/css/panel.css',
        dest: 'panel.min.css'
    }, {
        src: 'app/public/css/index.css',
        dest: 'index.min.css'
    }];

    const tasks = files.map(file =>
        gulp.src(file.src)
            .pipe(cleanCSS())
            .pipe(rename(file.dest)));

    return es.merge(tasks)
        .pipe(gulp.dest('public/css'));
});

gulp.task('BuildJS', () => {
    const files = [{
        src: [
            'app/public/services/*.js',
            'app/public/panel/**/*.js'
        ],
        dest: 'panel.bundle.js'
    }, {
        src: [
            'app/public/services/*.js',
            'app/public/shimapan/**/*.js'
        ],
        dest: 'shimapan.bundle.js'
    }, {
        src: [
            'app/public/index/*.js'
        ],
        dest: 'index.bundle.js'
    }];

    const tasks = files.map(file =>
        browserify({entries: file.src.map(g => glob.sync(g)), debug: true})
            .bundle()
            .pipe(source(file.dest))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('public/js')));

    return es.merge(tasks)
        .pipe(gulp.dest('public/js'));
});

gulp.task('default', gulp.parallel('BuildJS', 'BuildCSS'));
