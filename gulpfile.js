"use strict";

// System
let _ = require('lodash');
let gulp = require('gulp');
let yargs = require('yargs');
var uglify = require('gulp-uglify');

// Stream tools
let combiner = require('stream-combiner2')
let es = require('event-stream');
let rename = require('gulp-rename');

// Code mangling tools
let clean_css = require('gulp-clean-css');
let concat = require('gulp-concat');
let htmlmin = require('gulp-htmlmin')
let sourcemaps = require('gulp-sourcemaps');
let postcss = require('gulp-postcss');
let cssnext = require('postcss-cssnext');

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

let css_renderer_js_files = _.flatten([
  './build/js/three_math.min.js',
  './libs/artTemplate/dist/template-native.js',
  './js/snot_utils.js',
  './js/snot_css_renderer.js',
  './js/snot_controls.js',
]);

let webgl_renderer_js_files = _.flatten([
  './libs/three.js/build/three.min.js',
  './libs/three.js/examples/js/renderers/Projector.js',
  './js/snot_utils.js',
  './js/snot_webgl_renderer.js',
  './js/snot_controls.js',
]);

let both_renderer_js_files = _.flatten([
  './libs/three.js/build/three.min.js',
  './libs/three.js/examples/js/renderers/Projector.js',
  './libs/artTemplate/dist/template-native.js',
  './js/snot_utils.js',
  './js/snot_css_renderer.js',
  './js/snot_webgl_renderer.js',
  './js/snot_controls.js',
]);

function concat_js() {
  do_watch('concat_js');

  function make_stream(js_files, output_name) {
    let s = [];
    s.push(gulp.src(js_files));
    if (options.d) {
      s.push(sourcemaps.init({loadMaps: true}));
    } else {
      s.push(uglify());
    }
    s.push(concat(output_name));

    if (options.d) {
      s.push(sourcemaps.write());
    }

    s.push(gulp.dest('./build/js'));
    return taskify_stream(s);
  }

  return es.merge(make_stream(both_renderer_js_files, 'snot.min.js'),
                  make_stream(css_renderer_js_files, 'snot_css_renderer.min.js'),
                  make_stream(webgl_renderer_js_files, 'snot_webgl_renderer.min.js'));
}

let task_2_files = {
  concat_js: ['./js/**/*.js'],
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

function three_math() {
  let js_files = [
    './js/three_math.js',
    './libs/three.js/src/math/Vector3.js',
    './libs/three.js/src/math/Matrix4.js',
    './libs/three.js/src/math/Quaternion.js',
    './libs/three.js/src/math/Euler.js',
  ];
  let s = [];
  s.push(gulp.src(js_files));
  s.push(uglify());
  if (options.d) {
    s.push(sourcemaps.init({loadMaps: true}));
  }
  s.push(concat('three_math.min.js'));

  if (options.d) {
    s.push(sourcemaps.write());
  }

  s.push(gulp.dest('./build/js'));
  return taskify_stream(s);
}

gulp.task('css', css);
gulp.task('three_math', three_math);
gulp.task('concat_js', ['three_math'], concat_js);

gulp.task('default', ['css', 'concat_js']);
