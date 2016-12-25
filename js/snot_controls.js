
var dom_offset_top;
var dom_offset_left;

var snot;
function init(caller) {
  snot = caller;

  dom_offset_left = util.left_pos(snot.dom);
  dom_offset_top = util.top_pos(snot.dom);

  window.addEventListener('orientationchange', function(ev) {
    snot.controls.screen_orientation = window.orientation || 0;
  }, false);

  window.addEventListener('deviceorientation', function(ev) {
    if (ev.alpha !== null) {
      snot.controls.gyro_data.beta = ev.beta  * Math.PI / 180 ;
      snot.controls.gyro_data.gamma = ev.gamma  * Math.PI / 180;
      snot.controls.gyro_data.alpha = ev.alpha  * Math.PI / 180;
    } else {
      snot.controls.gyro_data.beta = snot.controls.gyro_data.gamma = snot.controls.gyro_data.alpha = -1;
    }
  }, true);
}

var util = require('./snot_util.js');
var distance3D = util.distance3D;
var distance2D = util.distance2D;
var floor = Math.floor;
var cos = Math.cos;
var sin = Math.sin;
var atan = Math.atan;
var tan = Math.tan;
var PI = Math.PI;

var m_make_rotation_axis = util.m_make_rotation_axis;
var m_multiply = util.m_multiply;
var m_set_position = util.m_set_position;
var m_make_rotation_from_quaternion = util.m_make_rotation_from_quaternion;
var v_set_from_matrix_position = util.v_set_from_matrix_position;

var touches = {
  fx: 0,   // First  finger x
  fy: 0,   // First  finger y
  sx: 0,   // Second finger x
  sy: 0    // Second finger y
};

var mouse_move = function(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopPropagation();

  var x = Math.floor(event.clientX >= 0 ? event.clientX : event.touches[0].pageX);
  var y = Math.floor(event.clientY >= 0 ? event.clientY : event.touches[0].pageY);
  x -= dom_offset_left;
  y -= dom_offset_top;

  touches.click = false;

  if (!touches.is_touching) {
    return false;
  }

  if (event.touches && event.touches.length > 1) {

    var cfx = x;                          // Current frist  finger x
    var cfy = y;                          // Current first  finger y
    var csx = event.touches[1].pageX;     // Current second finger x
    var csy = event.touches[1].pageY;     // Current second finger y

    var dis = distance2D(touches.fx, touches.fy, touches.sx, touches.sy) - distance2D(cfx, cfy, csx, csy);

    var ratio = 0.12;
    snot.set_fov(snot.fov + dis * ratio);

    touches.fx = cfx;
    touches.fy = cfy;
    touches.sx = csx;
    touches.sy = csy;

    return false;
  }

  if (snot.on_touch_move) {
    if (snot.raycaster_on_touch_move) {
      var point = compute_raycaster_point(x, y);
      snot.on_touch_move(event, point);
    } else {
      snot.on_touch_move(event);
    }
    return;
  }

  snot.dest_ry = snot.dest_ry + (touches.fx - x) * snot.mouse_sensitivity;
  snot.dest_rx = snot.dest_rx - (touches.fy - y) * snot.mouse_sensitivity;

  touches.fx = x;
  touches.fy = y;

  snot.dest_rx = snot.dest_rx > 90 ? 90 : snot.dest_rx;
  snot.dest_rx = snot.dest_rx < -90 ? -90 : snot.dest_rx;

};

function compute_raycaster_point(x, y) {
  var mouse = new THREE.Vector2();
  mouse.set((x / snot.width) * 2 - 1, - (y / snot.height) * 2 + 1);
  snot.raycaster.setFromCamera(mouse, snot.camera);
  var intersects = snot.raycaster.intersectObjects(snot.suspects_for_raycaster);
  var point = util.standardlization(intersects[0].point, snot.clicks_depth);
  return point;
}

var mouse_down = function (event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopPropagation();

  var x = floor(event.clientX >= 0 ? event.clientX : event.touches[0].clientX);
  var y = floor(event.clientY >= 0 ? event.clientY : event.touches[0].clientY);
  x -= dom_offset_left;
  y -= dom_offset_top;

  touches.mouse_down_x = x;
  touches.mouse_down_y = y;
  touches.fx = x;
  touches.fy = y;
  touches.click = true;

  if (event.touches && event.touches.length > 1) {

    touches.sx = event.touches[1].pageX;
    touches.sy = event.touches[1].pageY;

  }

  if (snot.on_touch_start) {
    if (snot.raycaster_on_touch_start) {
      var point = compute_raycaster_point(x, y);
      snot.on_touch_start(event, point);
    } else {
      snot.on_touch_start(event);
    }
  }

  touches.is_touching = true;
};

var mouse_wheel = function (event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopPropagation();

  var offset = event.deltaY;
  snot.set_fov(snot.fov + offset * 0.06);

};

var mouse_up = function(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopPropagation();

  var x = floor(event.clientX >= 0 ? event.clientX : event.changedTouches[0].pageX);
  var y = floor(event.clientY >= 0 ? event.clientY : event.changedTouches[0].pageY);
  x -= dom_offset_left;
  y -= dom_offset_top;

  //Screen coordinate to Sphere 3d coordinate
  if (distance2D(touches.mouse_down_x, touches.mouse_down_y, x, y) < 5) {
    snot.controls.mouse_click(x, y);
  }
  if (snot.on_touch_end) {
    snot.on_touch_end(event);
  }
  touches.is_touching = false;
};

var controls = {
  init: init,
  on_mouse_down: mouse_down,
  on_mouse_move: mouse_move,
  on_mouse_up: mouse_up,
  on_mouse_wheel: mouse_wheel,
};


module.exports = controls;
