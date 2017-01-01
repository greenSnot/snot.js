var util = snot.util;
var THREE = snot.THREE;

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  snot.gyro = !snot.gyro;
});

function bullet_generator(data) {
  var size = 10;
  var loader = THREE.ImageUtils;
  var geometry = new THREE.PlaneGeometry(size, size);
  var material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.5,
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(data.x, data.y, data.z);
  mesh.lookAt(data.look_at);
  mesh.visible = false;
  mesh.name = data.id;
  return mesh;
}

function on_click(point, rotation) {
}

var bullet_fire_interval = 100; // ms
var bullets = {};
var bullet_origin_data = {
  x: 0,
  y: 0,
  z: 0,

  generator: 'bullet',
  running: false,
  dest_x: 0,
  dest_y: 0,
  dest_z: 0,

  origin_x: 0,
  origin_y: 0,
  origin_z: 0,
  progress: 0, // from 0(origin) to 1(destination)
  visible: false,
  look_at: new THREE.Vector3(0, 1, 0),

  need_update_position: false,
  need_update_visibility: false,
  need_update_look_at: false,
};

function reset_bullet(bullet, id) {
  util.merge_json(bullet, bullet_origin_data, true);
  bullet.id = bullet.id || id;
}

for (var i = 0;i < 50; ++i) {
  var id = 'bullet' + i;
  bullets[id] = {};
  reset_bullet(bullets[id], id);
}

snot.init({
  debug: true,
  size: 1024,
  clicks_depth: 1024 / 2.5,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  generator: {
    bullet: bullet_generator
  },
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  on_click: on_click,
  sprites: bullets,
});

function update() {
  for (var i in bullets) {
    var bullet = bullets[i];
    if (bullet.progress >= 1) {
      reset_bullet(bullet);
      bullet.need_update_position = true;
      bullet.need_update_visibility = true;
      continue;
    }
    update_bullet(bullet);
  }
  requestAnimationFrame(update);
  snot.update();
}

function fire(bullet) {
  bullet.running = true;
  bullet.visible = true;

  bullet.need_update_visibility = true;

  var look_at = snot.camera_look_at;
  var scalar = 300;
  bullet.dest_x = look_at.x * scalar;
  bullet.dest_y = look_at.y * scalar;
  bullet.dest_z = look_at.z * scalar;

  var origin = snot.camera.localToWorld(new THREE.Vector3(0, 10, 0));
  bullet.origin_x = origin.x;
  bullet.origin_y = origin.y;
  bullet.origin_z = origin.z;

}

var last_fire_time = 0;
function update_bullet(bullet) {
  var now = new Date().valueOf();
  if (bullet.running === false && now - last_fire_time > bullet_fire_interval) {
    fire(bullet);
    last_fire_time = now;
  }

  if (bullet.running) {
    bullet.progress += 0.01;
    bullet.x = (bullet.dest_x + bullet.origin_x) * bullet.progress - bullet.origin_x;
    bullet.y = (bullet.dest_y + bullet.origin_y) * bullet.progress - bullet.origin_y;
    bullet.z = (bullet.dest_z + bullet.origin_z) * bullet.progress - bullet.origin_z;

    bullet.need_update_position = true;
    bullet.need_update_look_at = true;
  }

}

update();
