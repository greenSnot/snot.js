var viewer = new snot({
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
});

var util = viewer.util;
document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  viewer.gyro = !viewer.gyro;
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
  viewer.update();
  if (bullets_running.length != max_bullets) {
    shoot();
  }
  var points_a = [];
  for (i in bullets_running) {
    id = bullets_running[i];
    var bullet = viewer.sprites[id];
    points_a.push(viewer.sprites[id]);
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
      viewer.sprites[id].dest_x = viewer.camera_look_at.x * bullet_shooting_range;
      viewer.sprites[id].dest_y = viewer.camera_look_at.y * bullet_shooting_range;
      viewer.sprites[id].dest_z = viewer.camera_look_at.z * bullet_shooting_range;
      bullet.x = viewer.camera_look_at.x;
      bullet.y = viewer.camera_look_at.y - bullet_offset_y;
      bullet.z = - viewer.camera_look_at.z;
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
    var enemy = viewer.sprites[id];
    points_b.push(viewer.sprites[id]);
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

  var kd = new util.kd_tree(points_b, function(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
  }, ['x', 'y', 'z']);

  for (i = 0; i < points_a.length; ++i) {
    var collision = kd.nearest(points_a[i], 1);
    for (j = 0; j < collision.length; ++j) {
      if (util.distance3D(collision[j][0], points_a[i]) < 30) {
        collision[j][0].status = -1;
      }
    }
  }

}
viewer.add_sprites(sprites);
update();

//viewer.run();
