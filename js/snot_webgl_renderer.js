var THREE = require('three');
var util = require('./snot_util.js');
var controls = require('./snot_controls.js');
var PI = Math.PI;
var snot = {
  version: 1.01,
  scene: undefined,
  renderer: 'webgl',
  sprites: {},
  fisheye_offset: 0,
  camera_look_at: {
    x: 0,
    y: 0,
    z: 1,
  },
  quality: 1,

  util: util,
  THREE: THREE,

  controls: {
    screen_orientation: 0,
    gyro_data: {
      alpha: 0,
      beta: 90 * PI / 180,
      gamma: 0
    },
  },
  mouse_sensitivity: 0.3,
  auto_rotation: 0,
  frames:0,
  bg_rotation: [0, 0, 0, 0, 0, 0],

  pause_animation: false,

  dom      : document.getElementById('snot-wrap'),
  camera   : undefined,
  container: document.getElementById('snot-container'),

  size: 1024,
  clicks_depth: 1024 / 2.5,

  gyro: false,

  quaternion: {},

  ry: 0,        // Rotate * degrees around y axis
  rx: 0,        // Rotate * degrees around x axis
  rz: 0,
  dest_rx: 0,   // Destination of rotationX
  dest_ry: 0,   // Destination of rotationY
  dest_rz: 0,   // Destination of rotationY

  max_fov: 120, // Max field of view (degree)
  min_fov: 60,  // Min field of view (degree)
  fov: 90,      // Default field of view
  smooth: 0.83, // between 0 to 1, from rigid to smooth
  on_click: function() {}, // background on click
  on_touch_move: function() {},
  on_touch_start: function() {},
  on_touch_end: function() {},
  sprite_on_click: function() {},

  suspects_for_raycaster: [],
  raycaster_on_touch_move: false,
  raycaster_on_touch_start: false,
  raycaster_from_mouse: null,
};

var epsilon = util.epsilon;
var distance3D = util.distance3D;
var distance2D = util.distance2D;

var renderer;
var screenshot_renderer;
var bg_materials = [];
var sprites = {};
var _overdraw = 1;
THREE.ImageUtils.crossOrigin = '*';

//0     1    2    3    4   5
//front down left back top right
//front down left back top right
var img_index_convert = [3, 0, 4, 1, 5, 2];
function load_bg_imgs(imgs) {
  if (imgs.length == 1) {
    var SphereGeometry = new THREE.SphereGeometry(snot.size, 32, 32);
    SphereGeometry.scale(- 1, 1, 1);
    var SphereMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(imgs[0])
    });
    var SphereMesh = new THREE.Mesh(SphereGeometry, SphereMaterial);
    snot.scene.add(SphereMesh);
  } else if (img.length == 6) {
    var size = snot.size;
    var precision = 1;
    var geometry = new THREE.BoxGeometry(size, size, size, precision, precision, precision);
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

    snot.scene.add(mesh);
  }
}
function init(config) {
  var i;
  for (i in config) {
    snot[i] = config[i];
  }
  var smooth = snot.smooth;
  snot.width = snot.dom.offsetWidth;
  snot.height = snot.dom.offsetHeight;
  snot.smooth = 0;
  for (i in sprites) {
    snot.scene.remove(snotscene.getObjectByName(i));
  }
  sprites = {};

  var container = snot.container;
  snot.camera = new THREE.PerspectiveCamera(snot.fov, snot.width / snot.height, 1, snot.size * 2);
  snot.camera.target = new THREE.Vector3(0, 0, 0);
  snot.camera.position.copy(snot.camera.localToWorld(new THREE.Vector3(0, 0, - snot.fisheye_offset)));
  snot.camera.updateMatrixWorld();

  snot.scene = new THREE.Scene();

  if (config.callback) {
    config.callback();
  }

  if (config.bg_imgs) {
    load_bg_imgs(config.bg_imgs);
  }

  var SphereGeometry = new THREE.SphereGeometry(snot.size * 2, 32, 32);
  var SphereMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
  var SphereMesh = new THREE.Mesh(SphereGeometry, SphereMaterial);
  snot.scene.add(SphereMesh);
  snot.suspects_for_raycaster.push(SphereMesh);

  add_sprites(config.sprites);

  snot.raycaster = new THREE.Raycaster();
  snot.raycaster.far = snot.size * 2;

  renderer = new THREE.WebGLRenderer();
  screenshot_renderer = new THREE.WebGLRenderer();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(snot.width, snot.height);
  screenshot_renderer.setPixelRatio(1);
  screenshot_renderer.setSize(snot.size, snot.size);
  container.appendChild(renderer.domElement);

  update();
  snot.smooth = smooth;

  snot.container.addEventListener('touchstart', controls.on_mouse_down, false);
  snot.container.addEventListener('touchmove' , controls.on_mouse_move, false);
  snot.container.addEventListener('touchend'  , controls.on_mouse_up  , false);

  snot.container.addEventListener('mousedown' , controls.on_mouse_down , false);
  snot.container.addEventListener('mousemove' , controls.on_mouse_move , false);
  snot.container.addEventListener('mouseup'   , controls.on_mouse_up   , false);
  snot.container.addEventListener('mousewheel', controls.on_mouse_wheel, false);
  controls.init(snot);
}

window.onresize = function() {
  snot.width = snot.dom.offsetWidth;
  snot.height = snot.dom.offsetHeight;

  snot.camera.aspect = snot.width / snot.height;
  snot.camera.updateProjectionMatrix();
  renderer.setSize(snot.width, snot.height);
};

snot.raycaster_from_mouse = function(x, y) {
  var mouse = new THREE.Vector2();
  mouse.set((x / snot.width) * 2 - 1, - (y / snot.height) * 2 + 1);
  snot.raycaster.setFromCamera(mouse, snot.camera);
  return snot.raycaster.intersectObjects(snot.suspects_for_raycaster);
};

snot.controls.mouse_click = function(x, y) {
  var intersects = snot.raycaster_from_mouse(x, y);
  if (intersects.length !== 0) {
    var point = intersects[0].point;
    if (intersects[0].object.data) {
      snot.sprite_on_click(intersects[0].object.data);
    } else {
      point = util.standardlization(point, snot.clicks_depth);
      var rotation = util.position_to_rotation(point.x, point.y, point.z);
      snot.on_click(point, rotation);
    }
  }
};

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

function update() {

  snot.ry += snot.auto_rotation;

  var ry = snot.dest_rx * Math.PI / 180 + Math.PI / 2;
  var rx = - snot.dest_ry * Math.PI / 180 + Math.PI;
  var rz = 0;

  var orientation = 0;
  if (snot.gyro) {
    ry = snot.controls.gyro_data.beta;
    rx = snot.controls.gyro_data.alpha;
    rz = - snot.controls.gyro_data.gamma;
    orientation = snot.controls.screen_orientation;
  }

  snot.camera.autoUpdateMatrix = false;

  camera_euler.set(ry, rx, rz, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

  target_quat.setFromEuler(camera_euler); // orient the device
  target_quat.multiply(rotate_90_quat); // camera looks out the back of the device, not the top
                                        // - PI/2 around the x-axis

  target_quat.multiply(adjust_screen_quats[orientation]); // adjust for screen orientation

  var new_quat = new THREE.Quaternion();
  THREE.Quaternion.slerp(snot.camera.quaternion, target_quat, new_quat, 1 - snot.smooth);
  snot.camera.quaternion.copy(new_quat);
  snot.camera.quaternion.normalize();

  var euler = new THREE.Euler();
  euler.order = 'YXZ';
  euler.setFromQuaternion(snot.camera.quaternion);
  snot.rx = euler.x * 180 / Math.PI;
  snot.ry = euler.y * 180 / Math.PI - 180;
  snot.rz = euler.z * 180 / Math.PI;

  snot.camera.fov = snot.fov;
  snot.camera.updateProjectionMatrix();
  snot.camera.updateMatrixWorld();
  snot.camera_look_at = snot.camera.localToWorld(new THREE.Vector3(0, 0, 3 + snot.fisheye_offset)).normalize();
  snot.camera.position.copy(snot.camera_look_at).multiplyScalar(snot.fisheye_offset);

  update_sprites();
  renderer.render(snot.scene, snot.camera);

  ++ snot.frames;
}

function update_sprites() {
  for (var i in snot.sprites) {
    var data = snot.sprites[i];
    var sprite = sprites[i];
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

function set_fov(fov) {
  snot.fov = fov;
  snot.fov = snot.fov > snot.max_fov ? snot.max_fov : snot.fov;
  snot.fov = snot.fov < snot.min_fov ? snot.min_fov : snot.fov;
}

function set_rx(rx) {
  snot.dest_rx = rx;
}

function set_ry(ry) {
  snot.dest_ry = ry;
}

function add_sprites(sps) {
  var id;
  for (var i in sps) {
    id = sps[i].id;
    if (sprites[id]) {
      console.warn('sprite exists');
      return;
    }
    var data = sps[i];
    var mesh = data.mesh_generator();

    mesh.data = data;
    mesh.name = id;
    mesh.visible = data.visible === undefined ? true : data.visible;

    sprites[mesh.name] = mesh;
    snot.sprites[mesh.name] = data;
    snot.suspects_for_raycaster.push(mesh);
    snot.scene.add(mesh);

  }
}

function remove_sprite(sprite_id) {
  var mesh = snot.scene.getChildByName(sprite_id);
  snot.scene.remove(mesh);
  for (var i in snot.suspects_for_raycaster) {
    if (snot.suspects_for_raycaster[i].name == sprite_id) {
      snot.suspects_for_raycaster.splice(i, 1);
      return;
    }
  }
}

function run() {
  snot._animateId = requestAnimationFrame(run);
  if (!snot.pause_animation) {
    update();
  }
}

function screenshot(directions) {
  directions = directions || [true, true, true, true, true, true]; // front bottom left back top right
  var camera = new THREE.PerspectiveCamera(90, 1, 1, snot.size);
  camera.target = new THREE.Vector3(0, 0, 0);
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
    screenshot_renderer.render(snot.scene, camera);
    images.push(screenshot_renderer.domElement.toDataURL('image/png'));
  }
  return images;
}

util.merge_json(snot, {
  set_fov: set_fov,
  set_rx: set_rx,
  set_ry: set_ry,
  init: init,
  run: run,
  update: update,
  update_sprites: update_sprites,
  add_sprites: add_sprites,
  remove_sprite: remove_sprite,
  screenshot: screenshot,
});

module.exports = snot;
