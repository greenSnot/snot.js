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
    side: THREE.DoubleSide,
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
  var size = 20;
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

var n_max_bullet = 50;
var bullet_fire_interval = 125; // ms
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

  initial_x: 0,
  initial_y: 0,
  initial_z: 0,
  progress: 0, // from 0(initial point) to 1(destination)
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

  for (var i = 0;i < n_max_bullet; ++i) {
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
    if (bullet.running) {
      candidates_a.push(bullet);
    }
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
    if (enemy.running) {
      candidates_b.push(enemy);
    }
  }
  var collision_pairs = util.collision_test({
      x: 200,
      y: 200,
      z: 200,
    }, {
      x: - 200,
      y: - 200,
      z: - 200,
    }, candidates_a, candidates_b, 5, 0.1);
  if (collision_pairs.length) {
    var k, l;
    for (k in collision_pairs) {
      for (l in collision_pairs[k].points_b) {
        collision_pairs[k].points_b[l].progress = 1;
      }
      for (l in collision_pairs[k].points_a) {
        collision_pairs[k].points_a[l].progress = 1;
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

  var initial = snot.camera.localToWorld(new THREE.Vector3(0, 3, 0));
  bullet.initial_x = initial.x;
  bullet.initial_y = initial.y;
  bullet.initial_z = initial.z;

  bullet.look_at.set( - initial.x, - initial.y, - initial.z);

}

var last_fire_time = 0;
function update_bullet(bullet) {
  var now = new Date().valueOf();
  if (bullet.running === false && now - last_fire_time > bullet_fire_interval) {
    fire(bullet);
    last_fire_time = now;
    bullet.need_update_look_at = true;
  }

  function parabola(bullet) {
    // y = - (x - k)^2 / c + d
    // satisfied by T(t1,t2), P(p1, p2)
    // c is known
    function compute_k_d(p1, p2, t1, t2, c) {
      t1 = t1 === p1 ? t1 + 0.01 : t1;
      var k = (p1 * p1 - t1 * t1 - c * t2 + c * p2) / ( - 2 * t1 + 2 * p1);
      var d = (k * k - 2 * t1 * k + t1 * t1 + c * t2) / c;
      return [k, d];
    }

    var p_to_o = util.distance3D(bullet.initial_x, bullet.initial_y, bullet.initial_z, 0, 0, 0);
    var t_to_o = util.distance3D(bullet.dest_x, bullet.dest_y, bullet.dest_z, 0, 0, 0);
    var p_rx = - snot.rx * Math.PI / 180;
    var p = [Math.cos(p_rx) * p_to_o , Math.sin(p_rx) * p_to_o];
    var t_rx = Math.atan(bullet.dest_y / Math.pow(bullet.dest_x * bullet.dest_x + bullet.dest_z * bullet.dest_z, 0.5));
    var t = [Math.cos(t_rx) * t_to_o , Math.sin(t_rx) * t_to_o];

    var c = 200;
    var res = compute_k_d(p[0], p[1], t[0], t[1], c);
    var k = res[0];
    var d = res[1];

    bullet.x = (bullet.dest_x + bullet.initial_x) * bullet.progress - bullet.initial_x;
    var y = - Math.pow(Math.pow(bullet.x * bullet.x + bullet.z * bullet.z, 0.5) - k, 2) / c + d;
    bullet.y = y;
    bullet.z = (bullet.dest_z + bullet.initial_z) * bullet.progress - bullet.initial_z;
  }

  function linear(bullet) {
    bullet.x = (bullet.dest_x + bullet.initial_x) * bullet.progress - bullet.initial_x;
    bullet.y = (bullet.dest_y + bullet.initial_y) * bullet.progress - bullet.initial_y;
    bullet.z = (bullet.dest_z + bullet.initial_z) * bullet.progress - bullet.initial_z;
  }

  if (bullet.running) {
    bullet.progress += 0.04;

    linear(bullet);
    //parabola(bullet);

    bullet.need_update_position = true;
  }

}

function reborn(enemy) {
  enemy.running = true;
  enemy.visible = true;

  enemy.need_update_visibility = true;

  var random = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize();
  var scalar = 100;
  enemy.initial_x = random.x * scalar;
  enemy.initial_y = random.y * scalar;
  enemy.initial_z = random.z * scalar;

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
    enemy.x = (enemy.initial_x) * (1 - enemy.progress);
    enemy.y = (enemy.initial_y) * (1 - enemy.progress);
    enemy.z = (enemy.initial_z) * (1 - enemy.progress);

    enemy.need_update_position = true;
  }

}

update();
