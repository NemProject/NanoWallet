var gulp          = require('gulp');
var notify        = require('gulp-notify');
var source        = require('vinyl-source-stream');
var browserify    = require('browserify');
var babelify      = require('babelify');
var ngAnnotate    = require('browserify-ngannotate');
var browserSync   = require('browser-sync').create();
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var uglify        = require('gulp-uglify');
var merge         = require('merge-stream');
var glob          = require('glob');

// Where our files are located
var jsFiles   = "src/app/**/*.js";
var viewFiles = "src/app/**/*.html";
var specFiles = "tests/specs/*.spec.js"
var specsArray = glob.sync(specFiles);

var interceptErrors = function(error) {
var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
};

// Task for app files
gulp.task('browserify', ['views'], function() {
  return browserify('./src/app/app.js')
      .transform(babelify, {presets: ["es2015"]})
      .transform(ngAnnotate)
      .bundle()
      .on('error', interceptErrors)
      //Pass desired output filename to vinyl-source-stream
      .pipe(source('main.js'))
      // Start piping stream to tasks!
      .pipe(gulp.dest('./build/'));
});

// Task for test files
gulp.task('browserifyTests', function() {
  return browserify(specsArray)
      .transform(babelify, {presets: ["es2015"]})
      .transform(ngAnnotate)
      .bundle()
      .on('error', interceptErrors)
      //Pass desired output filename to vinyl-source-stream
      .pipe(source('tests.js'))
      // Start piping stream to tasks!
      .pipe(gulp.dest('./build/tests/'));
});


// Just move files to build/
gulp.task('html', function() {
  return gulp.src("src/start.html")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/'));
});

gulp.task('tests', function() {
  return gulp.src("tests/start.html")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/tests'));
});

  gulp.task('js', function() {
  return gulp.src("src/vendors/**/*.js")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/vendors'));
});

    gulp.task('css', function() {
    return gulp.src("src/css/**/*")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/css'));
});

    gulp.task('images', function() {
    return gulp.src("src/images/*")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/images'));
});

// Cache template
gulp.task('views', function() {
  return gulp.src(viewFiles)
      .pipe(templateCache({
        standalone: true
      }))
      .on('error', interceptErrors)
      .pipe(rename("app.templates.js"))
      .pipe(gulp.dest('./src/app/config/'));
});

// This task is used for building production ready
// minified JS/CSS files into the dist/ folder
gulp.task('build', ['html', 'browserify'], function() {
  var html = gulp.src("build/index.html")
                 .pipe(gulp.dest('./dist/'));

  var js = gulp.src("build/main.js")
               .pipe(uglify())
               .pipe(gulp.dest('./dist/'));

  return merge(html,js);
});

// Developer auto update file watcher.
gulp.task('dev', ['html', 'js', 'css', 'images', 'browserify', 'tests', 'browserifyTests'], function() {
    browserSync.init(['./build/**/**.**'], {
    server: "./build",
    port: 4000,
    notify: false,
    ui: {
      port: 4001
    }
  });
  gulp.watch("src/index.html", ['html']);
  gulp.watch(viewFiles, ['views']);
  gulp.watch(jsFiles, ['browserify']);
});

// Run Tasks
gulp.task('default', ['html', 'js', 'css', 'images', 'browserify', 'tests', 'browserifyTests'], function() {
  // Other tasks are run from here.
});
