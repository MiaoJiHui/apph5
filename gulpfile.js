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
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;


// 静态服务器 + 监听 
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./"
        // proxy: "192.168.0.65"
    });
    gulp.watch("scss/*.scss", ['sass']);
    gulp.watch("*.html").on('change', reload);
});


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
        .pipe(gulp.dest('css'))
        .pipe(reload({stream: true}));
});


// css合并+ 浏览器兼容
gulp.task('css', function(){
    return gulp.src(['css/plyr.css', 'css/layer.css', 'css/app-style.css'])
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concatCss("css/app-bundle.css"))
        .pipe(gulp.dest('dist'))
        
});

// css压缩
gulp.task('cssmin', function(){
    return gulp.src('css/app-bundle.css')
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

// Concatenate 
gulp.task('scripts', function(){
    return gulp.src(['js/touch.js', 'js/swipe.js','js/plyr.js', 'js/layer.js', 'js/app-main.js'])
        .pipe(concat('app-all.js'))
        .pipe(gulp.dest('dist/js'));
});

// Minify JS
gulp.task('jsMinify', function(){
    return gulp.src('dist/js/app-all.js')
        .pipe(uglify())
        .pipe(rename("app-all.min.js"))
        .pipe(gulp.dest('dist/js'))
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('js/*.js', ['lint', 'scripts', 'jsMinify']);
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('css/*.css', ['css','cssmin']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'cssmin', 'watch']);
