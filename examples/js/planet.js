var max_fov = 150;
var duration = 2000; //ms
var size = 1024;
var normal_fov = 110;
var planet_fov = 150;

var viewer = new Snot({
  size: size,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  fov: planet_fov,
  max_fov: planet_fov,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.1,
  camera_offset_y: size,
  rx: -90,
  dest_rx: -90,
  ry: 0,
  lock_rx: true,
  min_detect_distance: 20,
  on_click: on_click,
});

var util = Snot.util;
var THREE = Snot.THREE;

var __frames;
var frames = Math.floor(duration / 60);
var step_offset = size / frames;
var step_rx;
var step_fov;

function to_normal_view() {
  if (__frames > frames) {
    return;
  }
  viewer.camera_offset_y -= step_offset;
  viewer.dest_rx -= step_rx;
  viewer.fov -= step_fov;
  viewer.camera_offset_y = Math.max(0, viewer.camera_offset_y);
  viewer.dest_rx = Math.min(0, viewer.dest_rx);
  viewer.fov = Math.max(normal_fov, viewer.fov);
  viewer.lock_rx = false;
  __frames ++;
}

function to_planet_view() {
  if (__frames > frames) {
    return;
  }
  viewer.camera_offset_y += step_offset;
  viewer.dest_rx += step_rx;
  viewer.fov += step_fov;
  viewer.camera_offset_y = Math.min(size, viewer.camera_offset_y);
  viewer.dest_rx = Math.max(-90, viewer.dest_rx);
  viewer.fov = Math.min(planet_fov, viewer.fov);
  viewer.lock_rx = true;
  __frames ++;
}

var animate = function() {};

function on_click(point, rotation) {
  __frames = 0;
  step_fov = (planet_fov - normal_fov) / frames;
  if (viewer.camera_offset_y) {
    step_rx = (viewer.dest_rx) / frames;
    animate = to_normal_view;
  } else {
    step_rx = -(viewer.dest_rx + 90) / frames;
    animate = to_planet_view;
  }
}

function update() {
  animate();
  viewer.update();
  requestAnimationFrame(update);
}
update();
