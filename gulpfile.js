// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var cssmin = require('gulp-cssmin');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concatCss = require('gulp-concat-css');
var autoprefixer = require('gulp-autoprefixer');


// Lint Task
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass 
gulp.task('sass', function() {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('css'));
});


// css合并＋压缩 + 浏览器兼容
gulp.task('cssmin', function(){
    return gulp.src('css/*.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concatCss("css/app-bundle.css"))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'))
        
});
// 测试用
gulp.task('autoprefixer', function(){
    return gulp.src('css/app-style.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename({suffix: '.auto'}))
        .pipe(gulp.dest('css'))
});

// Concatenate & Minify JS
gulp.task('scripts', function(){
    return gulp.src('js/*.js')
        .pipe(concat('app-all.js'))
        .pipe(uglify())
        .pipe(rename("app-all.min.js"))
        .pipe(gulp.dest('dist/js'))

});


// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('js/*.js', ['lint', 'scripts']);
    gulp.watch('scss/*.scss', ['sass']);
    gulp-watch('css/*css', ['cssmin']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'cssmin', 'watch']);
