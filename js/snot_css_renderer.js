var util = require('./snot_util.js');
var controls = require('./snot_controls.js');
var THREE = require('three');
var template = require('art-template');

var PI = Math.PI;
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var acos = Math.acos;
var atan = Math.atan;
var pow = Math.pow;
var floor = Math.floor;
var sqrt = Math.sqrt;

var snot = {
  renderer: 'css',
  version: 1.01,
  container: document.getElementById('snot-container'),
  dom: document.getElementById('snot-wrap'),

  util: util,
  THREE: THREE,

  quality: 1, // between 0 to 1, higher quality needs more computation
  camera_look_at: {
    x: 0,
    y: 0,
    z: 1,
  },
  controls: {
    screen_orientation: 0,
    gyro_data: {
      alpha: 0,
      beta: 90 * PI / 180,
      gamma: 0
    },
  },
  mouse_sensitivity: 0.3,
  auto_rotation: 0, //anticlockwise auto rotate * degrees per frame
  frames: 0, // counter
  bg_rotation: [0, 0, 0, 0, 0, 0], // front, down, left, back, top, right

  pause_animation: false,

  size: 1024,
  clicks_depth: 1024 / 2.5,

  generator: {},
  gyro: false,
  ry: 0,        // Rotate * degrees around y axis
  rx: 0,        // Rotate * degrees around x axis
  dest_rx: 0,   // Destination of rotationX
  dest_ry: 0,   // Destination of rotationY
  dest_rz: 0,   // Destination of rotationY

  max_fov: 120, // Max field of view (degree)
  min_fov: 60,  // Min field of view (degree)
  fov: 90,      // Default field of view
  smooth: 0.83, // between 0 to 1, from rigid to smooth
  min_detect_distance: 20, // click nearest sprite
  on_click: function() {}, // background on click
  sprite_on_click: function() {},
};

var camera_dom = document.getElementById('snot-camera');
var prev_gyro;

var camera_base_transform;
var previous_quat = new THREE.Quaternion();

var m_make_rotation_axis = util.m_make_rotation_axis;
var m_multiply = util.m_multiply;
var m_set_position = util.m_set_position;
var m_make_rotation_from_quaternion = util.m_make_rotation_from_quaternion;
var v_set_from_matrix_position = util.v_set_from_matrix_position;

var epsilon = util.epsilon;
var distance3D = util.distance3D;
var distance2D = util.distance2D;

var set_fov = function (degree) {
  if (degree < snot.min_fov || degree > snot.max_fov) {
    return;
  }
  snot.fov = degree;
  snot.container.style['-webkit-transform'] = 'scale(' + tan(snot.max_fov / 2 * PI / 180) / tan(snot.fov / 2 * PI / 180) + ')';
};

function reset() {
  var sprites = document.getElementsByClassName('sprite');
  for (var i = 0; i < sprites.length; ++ i) {
    remove_sprite(i);
  }
}

var init = function(config) {
  reset();

  cancelAnimationFrame(snot._animateId);

  for (var i in config) {
    if (i == 'generator') {
      util.merge_json(snot.generator, config.generator);
    }
    snot[i] = config[i];
  }

  snot._size = snot.size * snot.quality; // actual size

  var sprite_wrap_style_dom = document.createElement('style');
  sprite_wrap_style_dom.innerHTML = '.sprite-wrap{-webkit-transform: translateY(-50%) translateX(-50%) scale(' + snot.quality + ');}';
  document.getElementsByTagName('head')[0].appendChild(sprite_wrap_style_dom);

  prev_gyro = snot.gyro;

  snot.dest_rx = snot.rx;
  snot.dest_ry = snot.ry;

  snot.width = snot.dom.offsetWidth;
  snot.height = snot.dom.offsetHeight;

  //compute the max Horizontal Field of view
  //perspective= projectiveScreenWidth/2
  //           = width/2/tan(max_fov/2)
  snot.perspective = snot.width / 2 / tan(snot.max_fov / 2 * PI / 180);

  snot.container.style['-webkit-perspective'] = snot.perspective + 'px';

  //camera offset
  // Z is depth(front) Y is height X is right
  //
  // translateZ setFOV
  // rotateX rotate around X axis
  // rotateY rotate around Y axis
  // translateX translate the Camera to center
  // translateY
  camera_base_transform = 'translateX(' + epsilon(- (snot._size - snot.width) / 2) + 'px) translateY(' + epsilon(- (snot._size - snot.height) / 2) + 'px)';
  camera_dom.style['-webkit-transform'] = 'translateZ(-' + snot.perspective + 'px) rotateY(' + epsilon(snot.rx) + 'deg) rotateX(' + epsilon(snot.ry) + 'deg)' + camera_base_transform;

  set_fov(snot.fov);

  if (config.bg_imgs) {
    load_bg_imgs(config.bg_imgs, config.bg_rotation || snot.bg_rotation);
  }

  if (config) {
    add_sprites(config.sprites);
  }

  if (util.is_mobile()) {
  }

  if (config.callback) {
    config.callback();
  }
  snot.container.addEventListener('touchstart', controls.on_mouse_down, false);
  snot.container.addEventListener('touchmove' , controls.on_mouse_move, false);
  snot.container.addEventListener('touchend'  , controls.on_mouse_up  , false);

  snot.container.addEventListener('mousedown' , controls.on_mouse_down , false);
  snot.container.addEventListener('mousemove' , controls.on_mouse_move , false);
  snot.container.addEventListener('mouseup'   , controls.on_mouse_up   , false);
  snot.container.addEventListener('mousewheel', controls.on_mouse_wheel, false);
  controls.init(snot);
  update();
};

function load_bg_imgs(bg_imgs, bg_rotation) {
  var bg_config = {
    front : 'rotateY(90deg)' + '                rotateZ(' + bg_rotation[0] + 'deg)  translateZ(-' + (snot._size / 2) + 'px)',
    bottom: 'rotateY(90deg)' + 'rotateX(90deg)  rotateZ(' + bg_rotation[1] + 'deg)  translateZ(-' + (snot._size / 2) + 'px) rotateZ(90deg)',
    left  : 'rotateY(90deg)' + 'rotateY(90deg)  rotateZ(' + bg_rotation[2] + 'deg)  translateZ(-' + (snot._size / 2) + 'px)',
    back  : 'rotateY(90deg)' + 'rotateY(180deg) rotateZ(' + bg_rotation[3] + 'deg)  translateZ(-' + (snot._size / 2) + 'px)',
    top   : 'rotateY(90deg)' + 'rotateX(-90deg) rotateZ(' + bg_rotation[4] + 'deg)  translateZ(-' + (snot._size / 2) + 'px) rotateZ(-90deg)',
    right : 'rotateY(90deg)' + 'rotateY(-90deg) rotateZ(' + bg_rotation[5] + 'deg)  translateZ(-' + (snot._size / 2) + 'px)'
  };

  var bg_dom;
  var count = 0;
  for (var i in bg_config) {
    bg_dom = document.getElementsByClassName('snot-bg ' + i)[0];
    bg_dom.style['-webkit-transform'] = bg_config[i];
    bg_dom.style.width = snot._size + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )
    bg_dom.style.height = snot._size + 2 + 'px';       // 2 more pixels for overlapping gaps ( chrome's bug )

    bg_dom.setAttribute('src', bg_imgs[count]);
    bg_dom.setAttribute('data-index', count);
    ++count;
  }
}

var add_sprites = function(sprites) {
  for (var i in sprites) {
    if (!snot.sprites[sprites[i].id]) {
      snot.sprites[sprites[i].id] = sprites[i];
    }
    var t = sprites[i];
    var temp_wrapper = document.createElement('div');
    var inner_html = document.getElementById(snot.generator[t.generator]).innerHTML;
    temp_wrapper.innerHTML = template.render(inner_html)(t);
    var element = temp_wrapper.children[0];
    element.data = sprites[i];
    add_sprite_by_position(element, t);
  }
};

var remove_sprite = function(sprite_id) {
  document.getElementById(sprite_id).remove();
  delete(snot.sprites[sprite_id]);
};

function add_sprite_by_position(element, p) {

  var x = - p.x * snot.quality;
  var z = - p.z * snot.quality;
  var y = - p.y * snot.quality;

  var spriteContainer = document.createElement('div');
  spriteContainer.style.display = 'inline-block';
  spriteContainer.style.position = 'absolute';
  spriteContainer.className = 'sprite-container';
  spriteContainer.id = element.data.id;

  spriteContainer.style['-webkit-transform-origin-x'] = '0';
  spriteContainer.style['-webkit-transform-origin-y'] = '0';

  var arc = x === 0 && z === 0 ? 0 : acos( z / pow(x * x + z * z, 0.5));

  arc = x < 0 ? 2 * PI - arc : arc;
  arc = arc * 180 / PI;

  var r = distance3D(x, y, z, 0, 0, 0);
  x += snot._size / 2;
  y += snot._size / 2;

  spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - snot._size / 2) / r * 90)+'deg) rotateY(180deg)';

  var spriteWrap = document.createElement('div');
  spriteWrap.className='sprite-wrap';
  spriteWrap.appendChild(element);
  spriteWrap.setAttribute('data-visible', element.data.visible === false ? false : true);

  spriteContainer.appendChild(spriteWrap);
  camera_dom.appendChild(spriteContainer);
}

var update_sprite_visibility = function(id) {
  var visible = snot.sprites[id].visible;
  var spriteContainer = document.getElementById(id);
  spriteContainer.firstChild.setAttribute('data-visible', visible ? true : false);
};

var update_sprite_position = function(id) {
  var x = snot.sprites[id].x * snot.quality;
  var y = snot.sprites[id].y * snot.quality;
  var z = snot.sprites[id].z * snot.quality;
  z = -z;
  y = -y;
  var arc = x === 0 && z === 0 ? 0 : acos( z / pow(x * x + z * z, 0.5));

  arc = x < 0 ? 2 * PI - arc : arc;
  arc = arc * 180/ PI;

  var r = distance3D(x, y, z, 0, 0, 0);
  x += snot._size / 2;
  y += snot._size / 2;

  var spriteContainer = document.getElementById(id);

  spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - snot._size / 2) / r * 90) + 'deg) rotateY(180deg)';
};

function run() {
  snot._animateId = requestAnimationFrame(run);
  if (!snot.pause_animation) {
    update();
  }
}

var camera_euler = new THREE.Euler();
var target_quat = new THREE.Quaternion();
var rotate_90_quat = new THREE.Quaternion(- sqrt( 0.5 ), 0, 0, sqrt( 0.5 ));
var adjust_screen_quats = {
  0: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0),
  90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - 90),
  180: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - 180),
  '-90': new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 90),
};
var look_at_euler = new THREE.Euler();

function update_camera(x, y, z) {

  camera_euler.set(y, x, z, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

  target_quat.setFromEuler(camera_euler); // orient the device

  target_quat.multiply(rotate_90_quat); // camera looks out the back of the device, not the top
                                        // - PI/2 around the x-axis
  target_quat.multiply(adjust_screen_quats[snot.controls.screen_orientation]); // adjust for screen orientation

  var slerp_quat = new THREE.Quaternion();
  THREE.Quaternion.slerp(target_quat, previous_quat, slerp_quat, snot.smooth);
  previous_quat = slerp_quat;
  var look_at_quat = slerp_quat.clone();
  look_at_quat.x *= -1;
  look_at_quat.z *= -1;
  var look_at_mat = m_make_rotation_from_quaternion(look_at_quat.normalize()).transpose();
  var m_str = '';
  for (var i = 0; i < look_at_mat.elements.length; ++i) {
    m_str += epsilon(look_at_mat.elements[i]) + (i != 15 ? ',' : '');
  }
  var look_at_rot = look_at_euler.setFromRotationMatrix(look_at_mat, 'XZY');

  snot.rx = look_at_rot._x * 180 / PI;
  snot.ry = - look_at_rot._y * 180 / PI;
  snot.rz = look_at_rot._z * 180 / PI;

  snot.camera_look_at = v_set_from_matrix_position(m_multiply(
    m_make_rotation_axis({x: 0, y: 1, z: 0}, look_at_rot._y),
    m_make_rotation_axis({x: 0, y: 0, z: 1}, look_at_rot._z),
    m_make_rotation_axis({x: 1, y: 0, z: 0}, - look_at_rot._x),
    m_set_position({x: 0, y: 0, z: 1})
  )); // bad performance here

  camera_dom.style.transform = 'translateZ(' + epsilon(snot.perspective) + 'px)' + " matrix3d(" + m_str + ")"+ camera_base_transform;
}

function update() {
  snot.frames++;

  if (snot.gyro) {
    if (snot.controls.gyro_data.alpha === -1 && snot.controls.gyro_data.beta === -1 && snot.controls.gyro_data.gamma === - 1) {
      return;
    }

    update_camera(snot.controls.gyro_data.alpha, snot.controls.gyro_data.beta, - snot.controls.gyro_data.gamma);
  } else {
    if (prev_gyro) {
      snot.dest_rx = 0;
      snot.dest_ry = 0;
    }
    snot.dest_ry -= snot.auto_rotation;
    update_camera(- snot.dest_ry * PI / 180, snot.dest_rx * PI / 180 + PI/2, 0);
  }
  prev_gyro = snot.gyro;

  for (var i in snot.sprites) {
    var sprite = snot.sprites[i];
    if (sprite.need_update_position) {
      sprite.need_update_position = false;
      update_sprite_position(sprite.id);
    }
    if (sprite.need_update_visibility) {
      sprite.need_update_visibility = false;
      update_sprite_visibility(sprite.id);
    }
  }
}


snot.controls.mouse_click = function(x, y) {
  var R = 100;
  var fov = snot.fov;
  var size = snot._size;
  var arcFactor = Math.PI / 180;
  var rz = snot.rz * arcFactor;
  var width = snot.width;
  var height = snot.height;

  var ry = (x / width - 0.5) * fov;
  var rx = (y / height-0.5) * fov * height / width;
  var r = cos(fov / 2 * arcFactor) * size;
  var ratiox = (x - width / 2) / width * 2;
  var ratioy = (y - height / 2) / width * 2;
  var P = sin(fov / 2 * arcFactor) * size;

  ry = atan(ratiox * P / r);
  rx = atan(ratioy * P / r);

  ry *= 180 / PI;
  rx *= 180 / PI;

  var xyz2 = util.rotation_to_position(R, rx, 0);

  var rr = distance3D(- tan(ry * arcFactor) * xyz2.z, - xyz2.y, xyz2.z, 0, 0, 0);
  var ratio = R / rr;

  var new_x = - tan(ry * PI / 180) * xyz2.z * ratio;
  var new_y = - xyz2.y * ratio;
  var new_z = xyz2.z * ratio;

  var point = v_set_from_matrix_position(m_multiply(
    m_make_rotation_axis({x: 0, y: 1, z: 0}, snot.ry * PI / 180),
    m_make_rotation_axis({x: 0, y: 0, z: 1}, - snot.rz * PI / 180),
    m_make_rotation_axis({x: 1, y: 0, z: 0}, - snot.rx * PI / 180),
    m_set_position({x: new_x, y: new_y, z: new_z})
  ));

  point = util.standardlization(point, snot.clicks_depth * snot.quality);

  var min_offset = 0.4;
  var min_distance = snot.min_detect_distance * snot.quality;
  var nearest;

  var spriteContainers = document.getElementsByClassName('sprite-container');
  for (var i = 0 ;i < spriteContainers.length; ++i) {
    var self = spriteContainers[i];
    var matrix = util.css_text_to_matrix(self.style.webkitTransform);
    var candidate_point = util.standardlization({
      x: snot._size / 2 - matrix[12],
      y: matrix[13] - snot._size / 2,
      z: - matrix[14],
    }, snot.clicks_depth * snot.quality);

    var distance = distance3D(point.x, - point.y, point.z, candidate_point.x, candidate_point.y, candidate_point.z);
    if (distance < min_distance) {
      min_distance = distance;
      nearest = self.children[0];
    }
  }

  var rotation = util.position_to_rotation(point.x, point.z, point.y);
  if (nearest) {
    snot.sprite_on_click(snot.sprites[nearest.parentElement.id], nearest);
  } else {
    point = util.standardlization(point, snot.clicks_depth);
    snot.on_click(point, {
      rx: rotation[0],
      ry: rotation[1]
    });
  }
};

util.merge_json(snot, {
  set_fov: set_fov,
  init: init,
  run: run,
  update: update,
  add_sprites: add_sprites,
  remove_sprite: remove_sprite,
});

module.exports = snot;
