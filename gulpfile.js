var gulp = require('gulp')
var browserify = require('browserify')
var source = require('vinyl-source-stream')

gulp.task('browserify', function(){
    return browserify('./front-end/js/main.js')
    .bundle()
    .pipe(source("main.js"))
    .pipe(gulp.dest('./public/js'))
})

gulp.task('watch', function(){
    gulp.watch(['./front-end/js/**/*.js'], ['browserify']);
});

gulp.task('default', ['browserify']);