var util = require('./snot_util.js');
var THREE = require('three');

import {Controls} from './snot_controls.js';

var PI = Math.PI;
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var acos = Math.acos;
var atan = Math.atan;
var pow = Math.pow;
var floor = Math.floor;
var sqrt = Math.sqrt;

var camera_euler = new THREE.Euler();
var target_quat = new THREE.Quaternion();
var rotate_90_quat = new THREE.Quaternion(- sqrt( 0.5 ), 0, 0, sqrt( 0.5 ));
var adjust_screen_quats = {
  0: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0),
  90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - Math.PI / 2),
  180: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - Math.PI),
  '-90': new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
};
var look_at_euler = new THREE.Euler();

function get_default_options() {
  return {
    container: document.getElementById('snot-container'),
    dom: document.getElementById('snot-wrap'),

    quality: 1, // between 0 to 1, higher quality needs more computation
    camera_look_at: {
      x: 0,
      y: 0,
      z: 1,
    },
    mouse_sensitivity: 0.3,
    auto_rotation: 0, //anticlockwise auto rotate * degrees per frame
    frames: 0, // counter
    bg_rotation: [0, 0, 0, 0, 0, 0], // front, down, left, back, top, right
    bg_imgs: [],

    pause_animation: false,

    size: 1024,
    clicks_depth: 1024 / 2.5,

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
    controls_on_click: controls_on_click,

    camera_dom: document.getElementById('snot-camera'),
    sprites: {},
  };
}

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


class Snot {
  constructor(opts) {
    var default_options = get_default_options();
    for (var i in default_options) {
      this[i] = opts[i] || default_options[i];
    }
    this.ignore_map = {};
    this.width = this.dom.offsetWidth;
    this.height = this.dom.offsetHeight;
    this.init();
  }

  set_fov(degree) {
    if (degree < this.min_fov || degree > this.max_fov) {
      return;
    }
    this.fov = degree;
    this.container.style['-webkit-transform'] = 'scale(' + tan(this.max_fov / 2 * PI / 180) / tan(this.fov / 2 * PI / 180) + ')';
  }

  reset() {
    var sprites = document.getElementsByClassName('sprite');
    for (var i = 0; i < sprites.length; ++ i) {
      remove_sprite(i);
    }
  }

  init() {

    this._size = this.size * this.quality; // actual size

    var sprite_wrap_style_dom = document.createElement('style');
    sprite_wrap_style_dom.innerHTML = '.sprite-wrap{-webkit-transform: translateY(-50%) translateX(-50%) scale(' + this.quality + ');}';
    document.getElementsByTagName('head')[0].appendChild(sprite_wrap_style_dom);

    this.prev_gyro = this.gyro;

    this.dest_rx = this.rx;
    this.dest_ry = this.ry;

    //compute the max Horizontal Field of view
    //perspective= projectiveScreenWidth/2
    //           = width/2/tan(max_fov/2)
    this.perspective = this.width / 2 / tan(this.max_fov / 2 * PI / 180);

    this.container.style['-webkit-perspective'] = this.perspective + 'px';

    //camera offset
    // Z is depth(front) Y is height X is right
    //
    // translateZ setFOV
    // rotateX rotate around X axis
    // rotateY rotate around Y axis
    // translateX translate the Camera to center
    // translateY
    camera_base_transform = 'translateX(' + epsilon(- (this._size - this.width) / 2) + 'px) translateY(' + epsilon(- (this._size - this.height) / 2) + 'px)';
    this.camera_dom.style['-webkit-transform'] = 'translateZ(-' + this.perspective + 'px) rotateY(' + epsilon(this.rx) + 'deg) rotateX(' + epsilon(this.ry) + 'deg)' + camera_base_transform;

    this.set_fov(this.fov);

    if (this.bg_imgs) {
      this.init_bg(this.bg_imgs, this.bg_rotation || this.bg_rotation);
    }

    this.add_sprites(this.sprites);

    this.controls = new Controls(this, this.controls_on_click);
    this.start_listeners();
    this.update();
  }

  start_listeners() {
    var self = this;
    function on_resize_handler(ev) {
      self.on_resize(ev);
    }
    function mouse_down_handler(ev) {
      self.controls.mouse_down_handler(ev);
    }
    function mouse_move_handler(ev) {
      self.controls.mouse_move_handler(ev);
    }
    function mouse_up_handler(ev) {
      self.controls.mouse_up_handler(ev);
    }
    function mouse_wheel_handler(ev) {
      self.controls.mouse_wheel_handler(ev);
    }
    function gyro_data_on_change_handler(ev) {
      self.controls.gyro_data_on_change_handler(ev);
    }
    function orientation_on_change_handler(ev) {
      self.controls.orientation_on_change_handler(ev);
    }
    this.controls.start_listeners({
      events: {
        touchstart: mouse_down_handler,
        touchmove: mouse_move_handler,
        touchend: mouse_up_handler,

        mousedown: mouse_down_handler,
        mousemove: mouse_move_handler,
        mouseup: mouse_up_handler,
        mousewheel: mouse_wheel_handler,

        orientationonchange: orientation_on_change_handler,
        deviceorientation: gyro_data_on_change_handler,
      }
    });

    window.addEventListener('resize', on_resize_handler, false);

    this.do_stop_listeners = function() {
      window.removeEventListener('resize', on_resize_handler, false);
      this.controls.stop_listeners({
        events: {
          touchstart: mouse_down_handler,
          touchmove: mouse_move_handler,
          touchend: mouse_up_handler,

          mousedown: mouse_down_handler,
          mousemove: mouse_move_handler,
          mouseup: mouse_up_handler,
          mousewheel: mouse_wheel_handler,

          orientationonchange: orientation_on_change_handler,
          deviceorientation: gyro_data_on_change_handler,
        }
      });
    };
  }

  stop_listeners() {
    this.do_stop_listeners();
  }

  on_resize() {
    this.width = this.dom.offsetWidth;
    this.height = this.dom.offsetHeight;
    this.perspective = this.width / 2 / tan(this.max_fov / 2 * PI / 180);
    this.container.style['-webkit-perspective'] = this.perspective + 'px';
    camera_base_transform = 'translateX(' + epsilon(- (this._size - this.width) / 2) + 'px) translateY(' + epsilon(- (this._size - this.height) / 2) + 'px)';
    this.camera_dom.style['-webkit-transform'] = 'translateZ(-' + this.perspective + 'px) rotateY(' + epsilon(this.rx) + 'deg) rotateX(' + epsilon(this.ry) + 'deg)' + camera_base_transform;
  }
  init_bg(bg_imgs, bg_rotation) {
    var bg_config = {
      front : 'rotateY(90deg)' + '                rotateZ(' + bg_rotation[0] + 'deg)  translateZ(-' + (this._size / 2) + 'px)',
      bottom: 'rotateY(90deg)' + 'rotateX(90deg)  rotateZ(' + bg_rotation[1] + 'deg)  translateZ(-' + (this._size / 2) + 'px) rotateZ(90deg)',
      left  : 'rotateY(90deg)' + 'rotateY(90deg)  rotateZ(' + bg_rotation[2] + 'deg)  translateZ(-' + (this._size / 2) + 'px)',
      back  : 'rotateY(90deg)' + 'rotateY(180deg) rotateZ(' + bg_rotation[3] + 'deg)  translateZ(-' + (this._size / 2) + 'px)',
      top   : 'rotateY(90deg)' + 'rotateX(-90deg) rotateZ(' + bg_rotation[4] + 'deg)  translateZ(-' + (this._size / 2) + 'px) rotateZ(-90deg)',
      right : 'rotateY(90deg)' + 'rotateY(-90deg) rotateZ(' + bg_rotation[5] + 'deg)  translateZ(-' + (this._size / 2) + 'px)'
    };

    var bg_dom;
    var count = 0;
    for (var i in bg_config) {
      bg_dom = document.getElementsByClassName('snot-bg ' + i)[0];
      bg_dom.style['-webkit-transform'] = bg_config[i];
      bg_dom.style.width = this._size + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )
      bg_dom.style.height = this._size + 2 + 'px';       // 2 more pixels for overlapping gaps ( chrome's bug )

      bg_dom.setAttribute('src', bg_imgs[count]);
      bg_dom.setAttribute('data-index', count);
      ++count;
    }
  }

  add_sprites(sprites) {
    for (var i in sprites) {
      if (!this.sprites[sprites[i].id]) {
        this.sprites[sprites[i].id] = sprites[i];
      }
      var data = sprites[i];
      var temp_wrapper = document.createElement('div');
      temp_wrapper.innerHTML = data.mesh_generator();
      var element = temp_wrapper.children[0];
      element.data = sprites[i];
      this.add_sprite_by_position(element, data);
      if (data.ignore_raycaster) {
        this.ignore_map[data.id] = true;
      }
    }
  }
  remove_sprite(sprite_id) {
    document.getElementById(sprite_id).remove();
    delete(this.sprites[sprite_id]);
    delete(this.ignore_map[sprite_id]);
  }

  add_sprite_by_position(element, p) {

    var x = - p.x * this.quality;
    var z = - p.z * this.quality;
    var y = - p.y * this.quality;

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
    x += this._size / 2;
    y += this._size / 2;

    spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - this._size / 2) / r * 90)+'deg) rotateY(180deg)';

    var spriteWrap = document.createElement('div');
    spriteWrap.className='sprite-wrap';
    spriteWrap.appendChild(element);
    spriteWrap.setAttribute('data-visible', element.data.visible === false ? false : true);

    spriteContainer.appendChild(spriteWrap);
    this.camera_dom.appendChild(spriteContainer);
  }

  update_sprite_visibility(id) {
    var visible = this.sprites[id].visible;
    var spriteContainer = document.getElementById(id);
    spriteContainer.firstChild.setAttribute('data-visible', visible ? true : false);
  }

  update_sprite_position(id) {
    var x = this.sprites[id].x * this.quality;
    var y = this.sprites[id].y * this.quality;
    var z = this.sprites[id].z * this.quality;
    z = -z;
    y = -y;
    var arc = x === 0 && z === 0 ? 0 : acos( z / pow(x * x + z * z, 0.5));

    arc = x < 0 ? 2 * PI - arc : arc;
    arc = arc * 180/ PI;

    var r = distance3D(x, y, z, 0, 0, 0);
    x += this._size / 2;
    y += this._size / 2;

    var spriteContainer = document.getElementById(id);

    spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - this._size / 2) / r * 90) + 'deg) rotateY(180deg)';
  }

  run() {
    this._animateId = requestAnimationFrame(() => this.run());
    if (!this.pause_animation) {
      this.update();
    }
  }

  update_camera(x, y, z) {
    var orientation = 0;
    if (this.gyro) {
      orientation = this.controls.screen_orientation;
    }

    camera_euler.set(y, x, z, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

    target_quat.setFromEuler(camera_euler); // orient the device

    target_quat.multiply(rotate_90_quat); // camera looks out the back of the device, not the top
    // - PI/2 around the x-axis
    target_quat.multiply(adjust_screen_quats[orientation]); // adjust for screen orientation

    var slerp_quat = new THREE.Quaternion();
    THREE.Quaternion.slerp(target_quat, previous_quat, slerp_quat, this.smooth);
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

    this.rx = look_at_rot._x * 180 / PI;
    this.ry = - look_at_rot._y * 180 / PI;
    this.rz = look_at_rot._z * 180 / PI;

    this.camera_look_at = v_set_from_matrix_position(m_multiply(
      m_make_rotation_axis({x: 0, y: 1, z: 0}, look_at_rot._y),
      m_make_rotation_axis({x: 0, y: 0, z: 1}, look_at_rot._z),
      m_make_rotation_axis({x: 1, y: 0, z: 0}, - look_at_rot._x),
      m_set_position({x: 0, y: 0, z: 1})
    )); // bad performance here

    this.camera_dom.style.transform = 'translateZ(' + epsilon(this.perspective) + 'px)' + " matrix3d(" + m_str + ")"+ camera_base_transform;
  }

  update() {
    this.frames++;

    if (this.gyro) {
      if (this.controls.gyro_data.alpha === -1 && this.controls.gyro_data.beta === -1 && this.controls.gyro_data.gamma === - 1) {
        return;
      }

      this.update_camera(this.controls.gyro_data.alpha, this.controls.gyro_data.beta, - this.controls.gyro_data.gamma);
    } else {
      if (this.prev_gyro) {
        this.dest_rx = 0;
        this.dest_ry = 0;
      }
      this.dest_ry -= this.auto_rotation;
      this.update_camera(- this.dest_ry * PI / 180, this.dest_rx * PI / 180 + PI/2, 0);
    }
    this.prev_gyro = this.gyro;

    for (var i in this.sprites) {
      var sprite = this.sprites[i];
      if (sprite.need_update_position) {
        sprite.need_update_position = false;
        this.update_sprite_position(sprite.id);
      }
      if (sprite.need_update_visibility) {
        sprite.need_update_visibility = false;
        this.update_sprite_visibility(sprite.id);
      }
    }
  }

}

function controls_on_click(x, y) {
  var R = 100;
  var fov = this.fov;
  var size = this._size;
  var arcFactor = Math.PI / 180;
  var rz = this.rz * arcFactor;
  var width = this.width;
  var height = this.height;

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
    m_make_rotation_axis({x: 0, y: 1, z: 0}, this.ry * PI / 180),
    m_make_rotation_axis({x: 0, y: 0, z: 1}, - this.rz * PI / 180),
    m_make_rotation_axis({x: 1, y: 0, z: 0}, - this.rx * PI / 180),
    m_set_position({x: new_x, y: new_y, z: new_z})
  ));

  point = util.standardlization(point, this.clicks_depth * this.quality);

  var min_offset = 0.4;
  var min_distance = this.min_detect_distance * this.quality;
  var nearest;

  var spriteContainers = document.getElementsByClassName('sprite-container');
  for (var i = 0 ;i < spriteContainers.length; ++i) {
    var self = spriteContainers[i];
    if (this.ignore_map[self.parentElement.id]) {
      continue;
    }
    var matrix = util.css_text_to_matrix(self.style.webkitTransform);
    var candidate_point = util.standardlization({
      x: this._size / 2 - matrix[12],
      y: matrix[13] - this._size / 2,
      z: - matrix[14],
    }, this.clicks_depth * this.quality);

    var distance = distance3D(point.x, - point.y, point.z, candidate_point.x, candidate_point.y, candidate_point.z);
    if (distance < min_distance) {
      min_distance = distance;
      nearest = self.children[0];
    }
  }

  var rotation = util.position_to_rotation(point.x, point.z, point.y);
  if (nearest) {
    this.sprite_on_click(this.sprites[nearest.parentElement.id], nearest);
  } else {
    point = util.standardlization(point, this.clicks_depth);
    this.on_click(point, {
      rx: rotation[0],
      ry: rotation[1]
    });
  }
}

Snot.version = 1.05;
Snot.util = util;
Snot.THREE = THREE;

module.exports = Snot;
