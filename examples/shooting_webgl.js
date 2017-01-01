var util = snot.util;
var THREE = snot.THREE;

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  snot.gyro = !snot.gyro;
});

function bullet_generator(data) {
  var size = 2;
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

function enemy_generator(data) {
  var size = 2;
  var loader = THREE.ImageUtils;
  var geometry = new THREE.PlaneGeometry(size, size);
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
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

var bullet_fire_interval = 40; // ms
var enemy_reborn_interval = 500; // ms
var bullets = {};
var enemies = {};
var sprite_origin_data = {
  x: 0,
  y: 0,
  z: 0,

  generator: undefined,
  running: false,
  dest_x: 0,
  dest_y: 0,
  dest_z: 0,

  origin_x: 0,
  origin_y: 0,
  origin_z: 0,
  progress: 0, // from 0(origin) to 1(destination)
  visible: false,

  need_update_position: false,
  need_update_visibility: false,
  need_update_look_at: false,
};
var bullet_origin_data = util.clone(sprite_origin_data);
bullet_origin_data.generator = 'bullet';
bullet_origin_data.look_at = new THREE.Vector3(0, 0, 0);
var enemy_origin_data = util.clone(sprite_origin_data);
enemy_origin_data.generator = 'enemy';
enemy_origin_data.look_at = new THREE.Vector3(0, 0, 0);

function reset_bullet(bullet, id) {
  util.merge_json(bullet, bullet_origin_data, true);
  bullet.id = bullet.id || id;
}

function reset_enemy(enemy, id) {
  util.merge_json(enemy, enemy_origin_data, true);
  enemy.id = enemy.id || id;
}

function init_bullets() {
  function init_bullet(id) {
    bullets[id] = {};
    reset_bullet(bullets[id], id);
  }

  for (var i = 0;i < 50; ++i) {
    var id = 'bullet' + i;
    init_bullet(id);
  }
}

function init_enemies() {
  function init_enemy(id) {
    enemies[id] = {};
    reset_enemy(enemies[id], id);
  }
  for (var i = 0;i < 50; ++i) {
    var id = 'enemy' + i;
    init_enemy(id);
  }
}

init_bullets();
init_enemies();

var sprites = {};
for (var i in bullets) {
  sprites[i] = bullets[i];
}
for (var i in enemies) {
  sprites[i] = enemies[i];
}

snot.init({
  debug: true,
  size: 1024,
  clicks_depth: 1024 / 2.5,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  generator: {
    bullet: bullet_generator,
    enemy: enemy_generator
  },
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  sprites: sprites,
});

function update() {
  var i;
  var candidates_a = [], candidates_b = [];
  for (i in bullets) {
    var bullet = bullets[i];
    if (bullet.progress >= 1) {
      reset_bullet(bullet);
      bullet.need_update_position = true;
      bullet.need_update_visibility = true;
      continue;
    }
    update_bullet(bullet);
    candidates_a.push(bullet);
  }
  for (i in enemies) {
    var enemy = enemies[i];
    if (enemy.progress >= 1) {
      reset_enemy(enemy);
      enemy.need_update_position = true;
      enemy.need_update_visibility = true;
      continue;
    }
    update_enemy(enemy);
    candidates_b.push(enemy);
  }
  var collision_result = [];
  util.octree_collision({
    x: 200,
    y: 200,
    z: 200,
  }, {
    x: - 200,
    y: - 200,
    z: - 200,
  }, candidates_a, candidates_b, collision_result);
  if (collision_result.length) {
    var k, l;
    for (k in collision_result) {
      for (l in collision_result[k].points_b) {
        collision_result[k].points_b[l].progress = 1;
      }
      for (l in collision_result[k].points_a) {
        collision_result[k].points_a[l].progress = 1;
      }
    }
  }
  requestAnimationFrame(update);
  snot.update();
}

function fire(bullet) {
  bullet.running = true;
  bullet.visible = true;

  bullet.need_update_visibility = true;

  var look_at = snot.camera_look_at;
  var scalar = 100;
  bullet.dest_x = look_at.x * scalar;
  bullet.dest_y = look_at.y * scalar;
  bullet.dest_z = look_at.z * scalar;

  var origin = snot.camera.localToWorld(new THREE.Vector3(0, 3, 0));
  bullet.origin_x = origin.x;
  bullet.origin_y = origin.y;
  bullet.origin_z = origin.z;

  bullet.look_at.set( - origin.x, - origin.y, - origin.z);

}

var last_fire_time = 0;
function update_bullet(bullet) {
  var now = new Date().valueOf();
  if (bullet.running === false && now - last_fire_time > bullet_fire_interval) {
    fire(bullet);
    last_fire_time = now;
    bullet.need_update_look_at = true;
  }

  if (bullet.running) {
    bullet.progress += 0.02;
    bullet.x = (bullet.dest_x + bullet.origin_x) * bullet.progress - bullet.origin_x;
    bullet.y = (bullet.dest_y + bullet.origin_y) * bullet.progress - bullet.origin_y;
    bullet.z = (bullet.dest_z + bullet.origin_z) * bullet.progress - bullet.origin_z;

    bullet.need_update_position = true;
  }

}

function reborn(enemy) {
  enemy.running = true;
  enemy.visible = true;

  enemy.need_update_visibility = true;

  var random = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize();
  var scalar = 100;
  enemy.origin_x = random.x * scalar;
  enemy.origin_y = random.y * scalar;
  enemy.origin_z = random.z * scalar;

  var dest = snot.camera.localToWorld(new THREE.Vector3(0, 3, 0));
  enemy.dest_x = dest.x;
  enemy.dest_y = dest.y;
  enemy.dest_z = dest.z;

  enemy.look_at.set( - dest.x, - dest.y, - dest.z);
}

var last_reborn_time = 0;
function update_enemy(enemy) {
  var now = new Date().valueOf();
  if (enemy.running === false && now - last_reborn_time > enemy_reborn_interval) {
    reborn(enemy);
    last_reborn_time = now;
    enemy.need_update_look_at = true;
  }

  if (enemy.running) {
    enemy.progress += 0.0002;
    enemy.x = (enemy.origin_x) * (1 - enemy.progress);
    enemy.y = (enemy.origin_y) * (1 - enemy.progress);
    enemy.z = (enemy.origin_z) * (1 - enemy.progress);

    enemy.need_update_position = true;
  }

}

update();
