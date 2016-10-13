function random(arr){
    return arr[parseInt(Math.random()*(arr.length))]
}
function onSpriteClick(data){
    console.log(data);
    alert('onSpriteClick');
}
function on_click(x,y,z,rx,ry){
    snot.load_sprites([{
            //For CSS Renderer
            //TemplateId for template renderer
            template:'template-spot',

            spriteType:'spot',

            spotType:random(['straight','left','right']),
            id:'spot-'+123,
            text:'haha',
            x:x*4,
            y:y*4,
            z:z*4
    }]);
}

var sprites = {
  'spot1': {
    template:'template-spot',
    spriteType:'spot',
    spotType:random(['straight','left','right']),
    id:'spot1',
    text:'Home',
    x:4,
    y:120,
    z:360
  }, 'spot2': {
    template:'template-spot',
    spriteType:'spot',
    spotType:random(['straight','left','right']),
    id:'spot2',
    text:'Market',
    x:329,
    y:0,
    z:240
  }, 'spot3': {
    template:'template-spot',
    spriteType:'spot',
    spotType:random(['straight','left','right']),
    id:'spot3',
    text:'Bridge',
    x:320,
    y:0,
    z:-230
  }, 'spot2': {
    template:'template-spot',
    spriteType:'spot2',
    spotType:random(['straight','left','right']),
    id:'spot4',
    text:'Garage',
    x:400,
    y:0,
    z:-110
  }
};

var bullets_pool = [];
var bullets_running = [];
for (var i = 0 ;i < 5; ++i) {
  var id = 'bullet' + i;
  sprites[id] = {
    template:'template-bullet',
    id:id,
    x:0,
    y:-1,
    z:0,

    dist_x: 0,
    dist_y: 0,
    dist_z: 40,
    status: -1,
    visibility: false,

    velocity:1, // 1 px per frame
  };
  bullets_pool.push(id);
}

snot.init({
  cubeSize:1248,
  imgs_preview:[
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
  ],
  imgs_original:[
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
  ],
  imgs_rotation:[0,0,0,0,0,0],
  fov:90,
  max_fov:110,
  min_fov:60,
  smooth:0.17,
  moving_ratio:0.3,
  auto_rotation:0.0,
  rx:0,
  ry:0,
  min_detect_distance:20,
  on_click:on_click,
  onSpriteClick:onSpriteClick,
  sprites:sprites
});

let last_shoot_time = 0;
let shoot_interval = 300; //ms
let max_bullets = 4;
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

function update() {
  requestAnimationFrame(update);
  snot.update();
  if (bullets_running.length != max_bullets) {
    shoot();
  }
  for (var i = 0; i < bullets_running.length; ++i) {
    var id = bullets_running[i];
    var bullet = snot.sprites[id];
    if (bullet.status == -1) {
      // init or reset
      if (snot.frames <= i * 8) {
        continue;
      }
      bullet.distanceToOrigin = distance3D(bullet.dist_x, bullet.dist_y, bullet.dist_z, 0, 0, 0);
      bullet.steps = Math.floor(bullet.distanceToOrigin / bullet.velocity);
      bullet.step_x = (bullet.dist_x - bullet.x) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_y = (bullet.dist_y - bullet.y) * bullet.velocity / bullet.distanceToOrigin;
      bullet.step_z = (bullet.dist_z - bullet.z) * bullet.velocity / bullet.distanceToOrigin;
      bullet.visibility = true;
      bullet.status = 0;
    }
    if (!bullet.steps) {
      snot.sprites[id].dist_x = snot.camera_look_at.x * 30;
      snot.sprites[id].dist_y = snot.camera_look_at.y * 30;
      snot.sprites[id].dist_z = snot.camera_look_at.z * 30;
      bullet.x = snot.camera_look_at.x,
      bullet.y = snot.camera_look_at.y,
      bullet.z = - snot.camera_look_at.z -3;
      bullet.status = -1;
      bullet.visibility = false;
      destory_bullet(id);
    } else {
      snot.update_sprite_position(id, bullet.x + bullet.step_x, bullet.y + bullet.step_y, bullet.z + bullet.step_z);
      bullet.steps --;
    }
    snot.update_sprite_visibility(bullet.id, bullet.visibility);
  }
}
update();

//snot.run();
