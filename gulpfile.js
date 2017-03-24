"use strict";

// System
let _ = require('lodash');
let gulp = require('gulp');
let yargs = require('yargs');
let uglify = require('gulp-uglify');
let jshint = require('gulp-jshint');
let minify = require('gulp-minify');
let stylish = require('jshint-stylish');

// Stream tools
let combiner = require('stream-combiner2')
let es = require('event-stream');
let rename = require('gulp-rename');

// Code mangling tools
let clean_css = require('gulp-clean-css');
let concat = require('gulp-concat');
let htmlmin = require('gulp-htmlmin')
let postcss = require('gulp-postcss');
let cssnext = require('postcss-cssnext');
let browserify = require('browserify');

let source = require('vinyl-source-stream');
let buffer = require('vinyl-buffer');

let options = yargs
  .alias('w', 'watch')
  .alias('d', 'debug')
  .argv;

function taskify_stream(stream) {
  let task = combiner.obj(stream)
  if (options.pedantic) {
    task.on('error', function() {
      console.error(arguments);
      process.exit(1);
    });
  } else {
    // Errors are already printed so we don't need to attach
    // consoles / do console.error in these error handlers
    task.on('error', function() {});
  }
  return task;
}

function browserify_file(file, dest_name, dest, standalone, external) {
  let cfg = {
    debug: options.debug,
  };
  if (standalone) {
    cfg.standalone = standalone;
  }
  let r = browserify(file, cfg)
    .external(external || [])
    .transform('babelify', {
      presets: ['es2015'],
      //sourceMapsAbsolute: true,
      compact: false
    })
    .bundle()
    .pipe(source(dest_name))
    .pipe(buffer());
    //.pipe(minify())

  if (options.debug) {
    return r.pipe(gulp.dest(dest));
  } else {
    return r.pipe(uglify())
      .pipe(gulp.dest(dest));
  }
}

function hint() {
  do_watch('hint');
  return gulp.src(['./js/**/*.js'])
    .pipe(jshint({
      esversion: 6
    }))
    .pipe(jshint.reporter(stylish));
}

function css_renderer() {
  do_watch('css_renderer');
  return browserify_file('./js/snot_css_renderer.js', 'snot_css_renderer.min.js', './build/js', 'snot');
}

function webgl_renderer() {
  do_watch('webgl_renderer');
  return browserify_file('./js/snot_webgl_renderer.js', 'snot_webgl_renderer.min.js', './build/js', 'snot');
}

function both_renderer() {
  //TODO
}

let task_2_files = {
  css_renderer: ['./js/**/*.js'],
  hint: ['./js/**/*.js'],
  webgl_renderer: ['./js/**/*.js'],
  css: ['./css/*.css'],
};

let is_watching = [];
function do_watch(task_name) {
  if (options.watch && !_.includes(is_watching, task_name)) {
    console.log("Now watching " + task_name);
    is_watching.push(task_name);
    gulp.watch(task_2_files[task_name], [task_name]);
  }
}

function css() {
  do_watch('css');

  function make_css_stream(files, concat_name) {
    let s = [];
    s.push(gulp.src(files));
    s.push(postcss([cssnext({browsers: ['> 0.01%', '> 0.01% in CN']})]));
    if (concat_name) {
      s.push(concat(concat_name));
    }

    if (!options.d) {
      s.push(clean_css());
    }

    s.push(rename({suffix: '.min'}));
    s.push(gulp.dest('./build/css'));
    return taskify_stream(s);
  }

  let css_files = [
    './css/snot.css',
  ];

  return make_css_stream(css_files, 'snot.css');
}

gulp.task('css', css);
gulp.task('hint', hint);
gulp.task('css_renderer', css_renderer);
gulp.task('webgl_renderer', webgl_renderer);
gulp.task('both_renderer', ['css_renderer', 'webgl_renderer'], both_renderer);

gulp.task('default', ['hint', 'css', 'both_renderer']);
