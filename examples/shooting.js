function on_sprite_click(data){
  console.log(data);
  alert('on_sprite_click');
}
function on_click(x, y, z, rx, ry) {
  snot.load_sprites([{
    generator: 'spot',

    id: 'spot-' + 123,
    x: x * 4,
    y: y * 4,
    z: z * 4,

    spotType: 'right',
    text: 'haha',
  }]);
}

var sprites = {
  'spot1': {
    template: 'template-spot',
    generator: 'spot',
    spotType: 'left',
    id: 'spot1',
    text: 'Home',
    x: 4,
    y: 120,
    z: 360
  }, 'spot2': {
    template: 'template-spot',
    generator: 'spot',
    spotType: 'straight',
    id: 'spot2',
    text: 'Garage',
    x: 400,
    y: 0,
    z: -110
  }
};

var bullets_pool = [];
var bullets_running = [];
var bullet_shooting_range = 400;
var bullet_pool_size = 100;
var max_bullets = 35;
for (var i = 0 ;i < bullet_pool_size; ++i) {
  var id = 'bullet' + i;
  sprites[id] = {
    generator:'bullet',
    id:id,
    x:0,
    y:-1,
    z:0,

    dist_x: 0,
    dist_y: 0,
    dist_z: bullet_shooting_range,
    status: -1,
    visible: false,

    velocity:15, // 1 px per frame
  };
  bullets_pool.push(id);
}

snot.init({
  bg_size:1248,
  bg_imgs:[
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
  ],
  bg_rotation: [0,0,0,0,0,0],
  generator: {
    bullet: 'template-bullet',
    spot: 'template-spot',
  },
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  smooth: 0.17,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  min_detect_distance: 20,
  on_click: on_click,
  on_sprite_click: on_sprite_click,
  sprites: sprites
});

let last_shoot_time = 0;
let shoot_interval = 80; //ms
function shoot() {
  let now = new Date().valueOf();
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
  requestAnimationFrame(update);
  snot.update();
  if (bullets_running.length != max_bullets) {
    shoot();
  }
  for (var i in bullets_running) {
    var id = bullets_running[i];
    var bullet = snot.sprites[id];
    if (bullet.status == -1) {
      bullet.y = - bullet_offset_y;
      // init or reset
      bullet.distanceToOrigin = snot.util.distance3D(bullet.dist_x, bullet.dist_y, bullet.dist_z, 0, 0, 0);
      bullet.steps = Math.floor(bullet.distanceToOrigin / bullet.velocity);
      bullet.step_x = (bullet.dist_x - bullet.x) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_y = (bullet.dist_y - bullet.y) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_z = (bullet.dist_z - bullet.z) * bullet.velocity / bullet.distanceToOrigin;
      bullet.visible = true;
      bullet.status = 0;
      bullet.need_update_visibility = true;
    }
    if (!bullet.steps) {
      snot.sprites[id].dist_x = snot.camera_look_at.x * bullet_shooting_range;
      snot.sprites[id].dist_y = snot.camera_look_at.y * bullet_shooting_range;
      snot.sprites[id].dist_z = snot.camera_look_at.z * bullet_shooting_range;
      bullet.x = snot.camera_look_at.x,
      bullet.y = snot.camera_look_at.y - bullet_offset_y,
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
}
update();

//snot.run();
