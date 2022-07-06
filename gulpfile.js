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
var sass          = require('gulp-sass');
var autoprefixer  = require('gulp-autoprefixer');
var NwBuilder     = require('nw-builder');
var gutil         = require('gulp-util');

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

var autoprefixerOptions = {
  browsers: ['last 6 versions']
};

// Task for app files
gulp.task('browserify', ['views'], function() {
    return browserify({
      extensions: ['.jsx', '.js'],
      debug: true,
      cache: {},
      packageCache: {},
      fullPaths: true,
      entries: './src/app/app.js',
    })
    // .transform(ngAnnotate)
    .transform(babelify.configure({
        presets: [['es2015', {
          targets: {
            node: "current"
          }
        }]],
        plugins: [
          "syntax-dynamic-import",
          "transform-runtime",
          "transform-async-to-generator",
          ["transform-object-rest-spread", { "useBuiltIns": true }]
        ],
        ignore: /(bower_components)|(node_modules)/
    }))
    .transform(ngAnnotate)
    .bundle()
    .on("error", interceptErrors)
    .pipe(source('main.js'))
    .pipe(gulp.dest('./build/'));
});

// Task for test files
gulp.task('browserifyTests', function() {
  return browserify(specsArray)
      // .transform(babelify, {presets: ["es2015"]})
      .transform(babelify.configure({
        presets: [['es2015', {
          targets: {
            node: "current"
          }
        }]],
        plugins: [
          "syntax-dynamic-import",
          "transform-runtime",
          "transform-async-to-generator",
          ["transform-object-rest-spread", { "useBuiltIns": true }]
        ],
        ignore: /(bower_components)|(node_modules)/
      }))
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
  return gulp.src("src/vendors/**/*")
    .on('error', interceptErrors)
    .pipe(gulp.dest('./build/vendors'));
});

gulp.task('sass', function () {
  return gulp.src('src/sass/nano.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest('./build/css'));
});

gulp.task('css', function() {
  return gulp.src('src/css/**/*')
    .on('error', interceptErrors)
    .pipe(gulp.dest('./build/css'))
})

gulp.task('images', function() {
  return gulp.src("src/images/**/*")
    .on('error', interceptErrors)
    .pipe(gulp.dest('./build/images'));
});

gulp.task('package', function() {
  return gulp.src("src/package.json")
      .on('error', interceptErrors)
      .pipe(gulp.dest('./build/'));
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

// Build App
gulp.task('app', function () {
    var nw = new NwBuilder({
        version: '0.25.4',
        files: './build/**',
        buildDir: './dist',
        buildType: 'versioned',
        winIco: './build/images/logomark.ico',
        macIcns: './build/images/NanoWallet.icns',
        platforms: ['win64', 'osx64', 'linux64']
    });
    // Log stuff you want
    nw.on('log', function (msg) {
        gutil.log('nw-builder', msg);
    });
    // Build returns a promise, return it so the task isn't called in parallel
    return nw.build().catch(function (err) {
        gutil.log('nw-builder', err);
    });
  });

// Run Tasks
gulp.task('default', ['html', 'js', 'sass', 'css', 'images', 'package', 'browserify', 'tests', 'browserifyTests'], function() {
});

// Build packaged apps for production
gulp.task('build-app', ['html', 'js', 'sass', 'css', 'images', 'package', 'app'], function() {
});
