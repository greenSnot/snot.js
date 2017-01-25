var util = snot.util;
document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  snot.gyro = !snot.gyro;
});

function enemy_generator() {
  return '<div class="enemy"></div>';
}

function bullet_generator() {
  return '<div class="bullet">O</div>';
}

var sprites = {
};

var enemies_pool = [];
var enemies_running = [];
var enemies_pool_size = 20;
var max_enemies = 20;
for (var i = 0 ;i < enemies_pool_size; ++i) {
  var id = 'enemy' + i;
  sprites[id] = {
    mesh_generator: enemy_generator,
    id: id,
    x: 0,
    y: - 1,
    z: 0,

    dest_x: 0,
    dest_y: 0,
    dest_z: 0,
    status: -1,
    visible: false,

    velocity: 15, // 1 px per frame
  };
  enemies_pool.push(id);
  enemies_running.push(id);
}

var quality = 1;

var bullets_pool = [];
var bullets_running = [];
var bullet_shooting_range = 400 ;
var bullet_pool_size = 100;
var max_bullets = 35;
for (var i = 0 ;i < bullet_pool_size; ++i) {
  var id = 'bullet' + i;
  sprites[id] = {
    mesh_generator: bullet_generator,
    id: id,
    x: 0,
    y: - 1,
    z: 0,

    dest_x: 0,
    dest_y: 0,
    dest_z: bullet_shooting_range,
    status: -1,
    visible: false,

    velocity: 15, // 1 px per frame
  };
  bullets_pool.push(id);
}

snot.init({
  size: 1248,
  quality: quality,
  bg_imgs:[
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
  ],
  bg_rotation: [0,0,0,0,0,0],
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  min_detect_distance: 20,
  sprites: sprites
});

var last_shoot_time = 0;
var shoot_interval = 80; //ms
function shoot() {
  var now = new Date().valueOf();
  if (now - last_shoot_time > shoot_interval) {
    bullets_running.push(bullets_pool.pop());
    last_shoot_time = now;
  }
}
function destory_bullet(id) {
  for (var i = 0;i < bullets_running.length; ++i) {
    if (id == bullets_running[i]) {
      bullets_running.splice(i, 1);
      bullets_pool.push(id);
      return;
    }
  }
}

var bullet_offset_y = 50;
function update() {
  var i, id;
  requestAnimationFrame(update);
  snot.update();
  if (bullets_running.length != max_bullets) {
    shoot();
  }
  var points_a = [];
  for (i in bullets_running) {
    id = bullets_running[i];
    var bullet = snot.sprites[id];
    points_a.push(snot.sprites[id]);
    if (bullet.status == -1) {
      bullet.y = - bullet_offset_y;
      // init or reset
      bullet.distance_to_origin = util.distance3D(bullet.dest_x, bullet.dest_y, bullet.dest_z, 0, 0, 0);
      bullet.steps = Math.floor(bullet.distance_to_origin / bullet.velocity);
      bullet.step_x = (bullet.dest_x - bullet.x) * bullet.velocity / bullet.distance_to_origin;
      bullet.step_y = (bullet.dest_y - bullet.y) * bullet.velocity / bullet.distance_to_origin;
      bullet.step_z = (bullet.dest_z - bullet.z) * bullet.velocity / bullet.distance_to_origin;
      bullet.visible = true;
      bullet.status = 0;
      bullet.need_update_visibility = true;
    }
    if (!bullet.steps) {
      snot.sprites[id].dest_x = snot.camera_look_at.x * bullet_shooting_range;
      snot.sprites[id].dest_y = snot.camera_look_at.y * bullet_shooting_range;
      snot.sprites[id].dest_z = snot.camera_look_at.z * bullet_shooting_range;
      bullet.x = snot.camera_look_at.x;
      bullet.y = snot.camera_look_at.y - bullet_offset_y;
      bullet.z = - snot.camera_look_at.z;
      bullet.status = -1;
      bullet.visible = false;
      bullet.need_update_visibility = true;
      bullet.need_update_position = true;
      destory_bullet(id);
      continue;
    } else {
      bullet.x = bullet.x + bullet.step_x;
      bullet.y = bullet.y + bullet.step_y;
      bullet.z = bullet.z + bullet.step_z;
      bullet.steps --;
    }
    bullet.need_update_position = true;
  }

  var points_b = [];
  for (i in enemies_running) {
    id = enemies_running[i];
    var enemy = snot.sprites[id];
    points_b.push(snot.sprites[id]);
    if (enemy.status == -1) {
      enemy.status = 0;
      enemy.visible = true;
      enemy.x = Math.random() - 0.5;
      enemy.y = Math.random() - 0.5;
      enemy.z = Math.random() - 0.5;
      util.standardlization(enemy, 300);
      enemy.need_update_visibility = true;
    }
    enemy.need_update_position = true;
  }

  var collision = util.collision_test({
      x: snot.size * 1.5,
      y: snot.size * 1.5,
      z: snot.size * 1.5,
    }, {
      x: - snot.size * 1.5,
      y: - snot.size * 1.5,
      z: - snot.size * 1.5,
    }, points_a, points_b);
  if (collision.length) {
    for (var k in collision) {
      for (var l in collision[k].points_b) {
        collision[k].points_b[l].status = -1;
      }
    }
  }
}
update();

//snot.run();
