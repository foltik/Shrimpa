'use strict';

const gulp = require('gulp');
const gutil = require('gutil');

const watchify = require('watchify');
const browserify = require('browserify');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const es = require('event-stream');
const cleanCSS = require('gulp-clean-css');
const nodemon = require('gulp-nodemon');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const glob = require('glob');

let jsFiles = {
    src: [
        glob.sync('app/public/services/*.js'),
        glob.sync('app/public/panel/**/*.js'),
        glob.sync('app/public/shimapan/**/*.js'),
    ],
    dest: 'shimapan.bundle.js'
};

let staticJs = [{
    src: 'app/public/index/typegraph.js',
    dest: 'typegraph.min.js'
}];

const bundler = () =>
    browserify({
        entries: jsFiles.src,
        debug: true,
        cache: {},
        packageCache: {}
    });

const watcher = watchify(bundler());
watcher.on('log', gutil.log);

const bundle = pkg =>
    pkg.bundle()
        .pipe(source(jsFiles.dest))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('public/js'));

gulp.task('build', () => bundle(bundler()));

gulp.task('watch', () => {
    bundle(watcher);
    watcher.on('update', () => bundle(watcher));
});

gulp.task('minify', () => {
    const tasks = staticJs.map(file =>
        gulp.src(file.src)
            .pipe(rename(file.dest))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./')));

    return es.merge(tasks)
        .pipe(gulp.dest('public/js'));
});

gulp.task('default', gulp.parallel('build', 'minify'));
