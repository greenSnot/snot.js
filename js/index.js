function random(arr){
  return arr[parseInt(Math.random() * (arr.length))]
}

function onSpriteClick(data){
  console.log(data);
  alert('onSpriteClick');
}
function on_click(x, y, z, rx, ry) {
  snot.load_sprites([{
    //For CSS Renderer
    //TemplateId for template renderer
    template: 'template-spot',

    spriteType: 'spot',

    spotType: random(['straight', 'left', 'right']),
    id: 'spot-' + 123,
    text: 'haha',
    x: x * 4,
    y: y * 4,
    z: z * 4
  }]);
}

var sprites = {
  'spot1': {
    template: 'template-spot',
    spriteType: 'spot',
    spotType: random(['straight','left','right']),
    id: 'spot1',
    text: 'Home',
    x: 4,
    y: 120,
    z: 360
  }, 'spot2': {
    template: 'template-spot',
    spriteType: 'spot',
    spotType: random(['straight','left','right']),
    id: 'spot2',
    text: 'Market',
    x: 329,
    y: 0,
    z: 240
  }, 'spot3': {
    template: 'template-spot',
    spriteType: 'spot',
    spotType: random(['straight','left','right']),
    id: 'spot3',
    text: 'Bridge',
    x: 320,
    y: 0,
    z: -230
  }, 'spot2': {
    template: 'template-spot',
    spriteType: 'spot2',
    spotType: random(['straight','left','right']),
    id: 'spot4',
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
    template:'template-bullet',
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
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  smooth: 0.17,
  moving_ratio: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  min_detect_distance: 20,
  on_click: on_click,
  onSpriteClick: onSpriteClick,
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
      bullet.distanceToOrigin = distance3D(bullet.dist_x, bullet.dist_y, bullet.dist_z, 0, 0, 0);
      bullet.steps = Math.floor(bullet.distanceToOrigin / bullet.velocity);
      bullet.step_x = (bullet.dist_x - bullet.x) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_y = (bullet.dist_y - bullet.y) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_z = (bullet.dist_z - bullet.z) * bullet.velocity / bullet.distanceToOrigin;
      bullet.visible = true;
      bullet.status = 0;
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
      destory_bullet(id);
    } else {
      snot.update_sprite_position(id, bullet.x + bullet.step_x, bullet.y + bullet.step_y, bullet.z + bullet.step_z);
      bullet.steps --;
    }
    snot.update_sprite_visibility(bullet.id, bullet.visible);
  }
}
update();

//snot.run();
