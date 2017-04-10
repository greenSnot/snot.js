var THREE = require('three');
var util = require('./snot_util.js');

import {Controls} from './snot_controls.js';

var PI = Math.PI;
var sqrt = Math.sqrt;
var camera_euler = new THREE.Euler();
var target_quat = new THREE.Quaternion();
var rotate_90_quat = new THREE.Quaternion(- sqrt(0.5), 0, 0, sqrt(0.5));
var adjust_screen_quats = {
  0: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0),
  90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - Math.PI / 2),
  180: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - Math.PI),
  '-90': new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
};

function get_default_options() {
  return {
    sprites_meshes: {},
    scene: new THREE.Scene(),
    renderer: new THREE.WebGLRenderer(),
    screenshot_renderer: new THREE.WebGLRenderer(),
    frames:0,

    bg_imgs: [],
    sprites: {},
    fisheye_offset: 0,
    camera_look_at: {
      x: 0,
      y: 0,
      z: - 1,
    },
    quality: 1,
    camera_offset_y: 0,

    mouse_sensitivity: 0.3,
    auto_rotation: 0,
    bg_rotation: [0, 0, 0, 0, 0, 0],

    pause_animation: false,

    dom      : document.getElementById('snot-wrap'),
    container: document.getElementById('snot-container'),

    size: 1024,
    clicks_depth: 1024 / 2.5,

    gyro: false,

    ry: 0,        // Rotate * degrees around y axis
    rx: 0,        // Rotate * degrees around x axis
    rz: 0,
    dest_rx: 0,   // Destination of rotationX
    dest_ry: 0,   // Destination of rotationY
    dest_rz: 0,   // Destination of rotationY

    lock_rx: false,
    max_fov: 120, // Max field of view (degree)
    min_fov: 60,  // Min field of view (degree)
    fov: 90,      // Default field of view
    smooth: 0.83, // between 0 to 1, from rigid to smooth
    on_click: function() {}, // background on click
    on_touch_move: function() {},
    on_touch_start: function() {},
    on_touch_end: function() {},
    sprite_on_click: function() {},
    controls_on_click: controls_on_click,

    suspects_for_raycaster: [],
    raycaster_on_touch_move: false,
    raycaster_on_touch_start: false,
  };
}

var _overdraw = 1;
THREE.ImageUtils.crossOrigin = '*';

class Snot {
  constructor(opts) {
    var default_options = get_default_options();
    for (var i in default_options) {
      this[i] = opts[i] || default_options[i];
    }
    this.width = this.dom.offsetWidth;
    this.height = this.dom.offsetHeight;
    this.init();
  }
  clean() {
    for (var i in this.sprites_meshes) {
      this.scene.remove(this.scene.getObjectByName(i));
    }
  }

  init_camera() {
    this.camera = new THREE.PerspectiveCamera(this.fov, this.width / this.height, 1, this.size * 2);
    this.camera.position.set(0, 0, this.fisheye_offset);
    this.camera.updateMatrixWorld();
  }

  init_bg() {
    var imgs = this.bg_imgs;
    if (imgs.length == 1) {
      var SphereGeometry = new THREE.SphereGeometry(this.size, 32, 32);
      SphereGeometry.scale(- 1, 1, 1);
      var SphereMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(imgs[0])
      });
      var SphereMesh = new THREE.Mesh(SphereGeometry, SphereMaterial);
      this.scene.add(SphereMesh);
    } else if (imgs.length == 6) {
      var size = this.size;
      var precision = 1;
      //0     1    2    3    4   5
      //front down left back top right
      //front down left back top right
      var img_index_convert = [3, 0, 4, 1, 5, 2];
      var geometry = new THREE.BoxGeometry(size, size, size, precision, precision, precision);
      var bg_materials = [];
      for (var index = 0;index < 6; ++index) {
        var img_url = imgs[img_index_convert[index]];
        bg_materials.push(new THREE.MeshBasicMaterial({
          map: THREE.ImageUtils.loadTexture(img_url, THREE.UVMapping),
          overdraw: _overdraw
        }));
      }
      var material= new THREE.MeshFaceMaterial(bg_materials);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.scale.x = - 1;

      this.scene.add(mesh);
    }
  }

  update_sprites() {
    for (var i in this.sprites) {
      var data = this.sprites[i];
      var sprite = this.sprites_meshes[i];
      if (data.need_update_position) {
        sprite.position.set(data.x, data.y, data.z);
        data.need_update_position = false;
      }
      if (data.need_update_visibility) {
        sprite.visible = data.visible;
        data.need_update_visibility = false;
      }
      if (data.need_update_look_at) {
        sprite.lookAt(data.look_at);
        data.need_update_look_at = false;
      }
    }
  }

  add_sprites(sps) {
    var id;
    for (var i in sps) {
      id = sps[i].id;
      if (this.sprites_meshes[id]) {
        console.warn('sprite exists');
        return;
      }
      var data = sps[i];
      var mesh = data.mesh_generator();

      mesh.data = data;
      mesh.name = id;
      mesh.visible = data.visible === undefined ? true : data.visible;

      this.sprites_meshes[mesh.name] = mesh;
      data.mesh = mesh;
      this.sprites[mesh.name] = data;
      if (!data.ignore_raycaster) {
        this.suspects_for_raycaster.push(mesh);
      }
      this.scene.add(mesh);

    }
  }

  init_raycaster() {
    var SphereGeometry = new THREE.SphereGeometry(this.size * 2, 32, 32);
    var SphereMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
    var SphereMesh = new THREE.Mesh(SphereGeometry, SphereMaterial);
    this.scene.add(SphereMesh);
    this.suspects_for_raycaster.push(SphereMesh);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.size * 2;

  }

  init_renderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.screenshot_renderer.setPixelRatio(1);
    this.screenshot_renderer.setSize(this.size, this.size);
    this.container.appendChild(this.renderer.domElement);

  }

  init() {

    if (this.bg_imgs) {
      this.init_bg(this.bg_imgs);
    }
    this.init_camera();
    this.init_raycaster();
    this.init_renderer();

    this.add_sprites(this.sprites);

    this.controls = new Controls(this, this.controls_on_click);
    this.start_listeners();

    this.update();
  }

  screenshot(directions) {
    directions = directions || [true, true, true, true, true, true]; // front bottom left back top right
    var camera = new THREE.PerspectiveCamera(90, 1, 1, this.size);
    var look_at = [
      [0, 0, 1],
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, -1],
      [0, 1, 0],
      [-1, 0, 0],
    ];
    var images = [];
    for (var i = 0;i < 6; ++i) {
      if (!directions[i]) {
        continue;
      }
      camera.lookAt(new THREE.Vector3(look_at[i][0], look_at[i][1], look_at[i][2]));
      this.screenshot_renderer.render(this.scene, camera);
      images.push(this.screenshot_renderer.domElement.toDataURL('image/png'));
    }
    return images;
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

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  raycaster_from_mouse(x, y) {
    var mouse = new THREE.Vector2();
    mouse.set((x / this.width) * 2 - 1, - (y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(mouse, this.camera);
    return this.raycaster.intersectObjects(this.suspects_for_raycaster);
  }

  raycaster_point_from_mouse(mouse_x, mouse_y, depth) {
    depth = depth || 100;
    var mouse = new THREE.Vector2();
    mouse.set((mouse_x / this.width) * 2 - 1, - (mouse_y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(mouse, this.camera);

    var x1 = this.raycaster.ray.origin.x;
    var y1 = this.raycaster.ray.origin.y;
    var z1 = this.raycaster.ray.origin.z;
    var x2 = this.raycaster.ray.origin.x + this.raycaster.ray.direction.x;
    var y2 = this.raycaster.ray.origin.y + this.raycaster.ray.direction.y;
    var z2 = this.raycaster.ray.origin.z + this.raycaster.ray.direction.z;

    // (x - x1) / (x2 - x1) = (y - y1) / (y2 - y1) = (z - z1) / (z2 - z1)
    //
    // let kx = (y2 - y1) / (x2 - x1)
    // x = (y - y1) / (y2 - y1) * (x2 - x1) + x1
    //   = (y - y1) / kx + x1
    // x² = (y- y1)² / kx² + 2*x1*(y - y1) / kx + x1²
    //
    // let kz = (y2 - y1) / (z2 - z1)
    // z = (y - y1) / (y2 - y1) * (z2 - z1) + z1
    //   = (y - y1) / zx + z1
    // z² = (y- y1)² / kz² + 2*z1*(y - y1) / kz + z1²

    // x²+y²+z² = NET_SIZE²
    // (y-y1)² / kx² + 2*x1*(y - y1) / kx + x1² + y² + (y-y1)² / kz² + 2*z1*(y - y1) / kz + z1²= NET_SIZE²
    // (y-y1)² / kx² + (y-y1)² / kz² + 2*x1*(y - y1) / kx + 2*z1*(y - y1) / kz + x1² + y² + z1²= NET_SIZE²
    //
    // let t1 = (1 / kx² + 1 / kz²)
    // let t2 = (2*x1 / kx + 2*z1 / kz)
    // (y-y1)² * t1 + (y - y1) * t2 + x1² + y² + z1²= NET_SIZE²
    // t1*y² - 2*y*y1*t1 + y1²*t1 + t2 * y - y1 * t2 + y² = NET_SIZE² - x1² - z1²
    // (t1 + 1) * y² - (2*y1*t1 - t2) * y + y1²*t1 - y1*t2 = NET_SIZE² - x1² - z1²
    // (t1 + 1) * y² - (2*y1*t1 - t2) * y = NET_SIZE² - x1² - z1² - y1²*t1 + y1*t2
    //
    // a = (t1 + 1)
    // b = - (2*y1*t1 - t2)
    // c = -(NET_SIZE² - x1² - z1² - y1²*t1 + y1*t2)
    //
    // y= (4*a*c - b²) / (4*a)

    var kx = (y2 - y1) / (x2 - x1);
    var kz = (y2 - y1) / (z2 - z1);
    var t1 = 1 / kx / kx + 1 / kz / kz;
    var t2 = 2 * x1 / kx + 2 * z1 / kz;

    var a = t1 + 1;
    var b = t2 - 2 * y1 * t1;
    var c = - depth * depth + x1 * x1 + z1 * z1 + y1 * y1 * t1 - y1 * t2;

    var t_sqrt = Math.pow(b * b - 4 * a * c, 0.5);
    var y = (t_sqrt - b) / (2 * a);
    var x = (y - y1) / kx + x1;
    var z = (y - y1) / kz + z1;

    if (util.distance3D(x, y, z, x1, y1, z1) < util.distance3D(x, y, z, x2, y2, z2)) {
      y = - (t_sqrt + b) / (2 * a);
      x = (y - y1) / kx + x1;
      z = (y - y1) / kz + z1;
    }

    return new THREE.Vector3(x, y, z);
  }

  set_fov(fov) {
    this.fov = fov;
    this.fov = this.fov > this.max_fov ? this.max_fov : this.fov;
    this.fov = this.fov < this.min_fov ? this.min_fov : this.fov;
  }

  set_rx(rx) {
    if (this.lock_rx) return;
    this.dest_rx = rx;
    this.dest_rx = this.dest_rx > 90 ? 90 : this.dest_rx;
    this.dest_rx = this.dest_rx < -90 ? -90 : this.dest_rx;
  }

  set_ry(ry) {
    this.dest_ry = ry;
  }

  remove_sprite(sprite_id) {
    var mesh = this.scene.getChildByName(sprite_id);
    this.scene.remove(mesh);
    delete(this.sprites_meshes[sprite_id]);
    for (var i in this.suspects_for_raycaster) {
      if (this.suspects_for_raycaster[i].name == sprite_id) {
        this.suspects_for_raycaster.splice(i, 1);
        return;
      }
    }
  }
  update() {

    this.dest_ry += this.auto_rotation;

    var ry = this.dest_rx * Math.PI / 180 + Math.PI / 2;
    var rx = - this.dest_ry * Math.PI / 180 + Math.PI;
    var rz = 0;

    var orientation = 0;
    if (this.gyro) {
      ry = this.controls.gyro_data.beta;
      rx = this.controls.gyro_data.alpha;
      rz = - this.controls.gyro_data.gamma;
      orientation = this.controls.screen_orientation;
    }

    this.camera.autoUpdateMatrix = false;

    camera_euler.set(ry, rx, rz, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

    target_quat.setFromEuler(camera_euler); // orient the device
    target_quat.multiply(rotate_90_quat); // camera looks out the back of the device, not the top
    // - PI/2 around the x-axis

    target_quat.multiply(adjust_screen_quats[orientation]); // adjust for screen orientation

    var new_quat = new THREE.Quaternion();
    THREE.Quaternion.slerp(this.camera.quaternion, target_quat, new_quat, this.frames ? 1 - this.smooth : 1);
    this.camera.quaternion.copy(new_quat);
    this.camera.quaternion.normalize();
    this.camera.updateProjectionMatrix();

    var euler = new THREE.Euler();
    euler.order = 'YXZ';
    euler.setFromQuaternion(this.camera.quaternion);
    this.rx = euler.x * 180 / Math.PI;
    this.ry = euler.y * 180 / Math.PI - 180;
    this.rz = euler.z * 180 / Math.PI;

    this.camera.fov = this.fov;
    this.camera_look_at = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.camera.position.copy(this.camera_look_at).multiplyScalar(this.fisheye_offset);
    this.camera.position.y += this.camera_offset_y;

    this.update_sprites();
    this.renderer.render(this.scene, this.camera);

    ++this.frames;
  }
  run() {
    this._animateId = requestAnimationFrame(() => this.run());
    if (!this.pause_animation) {
      this.update();
    }
  }
}

function controls_on_click(x, y) {
  var intersects = this.raycaster_from_mouse(x, y);
  var point;
  var rotation;
  if (intersects.length !== 0) {
    point = intersects[0].point;
    if (intersects[0].object.data) {
      this.sprite_on_click(intersects[0].object.data);
    } else {
      point = util.standardlization(point, this.clicks_depth);
      rotation = util.position_to_rotation(point.x, point.y, point.z);
      this.on_click(point, rotation);
    }
  } else {
    point = this.raycaster_point_from_mouse(x, y, 1);
    rotation = util.position_to_rotation(point.x, point.y, point.z);
    this.on_click(point, rotation);
  }
}

Snot.version = 1.12;
Snot.util = util;
Snot.THREE = THREE;

module.exports = Snot;
