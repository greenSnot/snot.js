function random(arr){
    return arr[parseInt(Math.random()*(arr.length))]
}
function onSpriteClick(data){
    console.log(data);
    alert('onSpriteClick');
}
function onClick(x,y,z,rx,ry){
    snot.loadSprites([{
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

var bullets_id = [];
for (var i = 0 ;i < 5; ++i) {
  var id = 'bullet' + i;
  sprites[id] = {
    template:'template-bullet',
    id:id,
    x:0,
    y:-1,
    z:0,

    dist_x:0,
    dist_y:0,
    dist_z:40,
    status:-1,

    velocity:1, // 1 px per frame
  };
  bullets_id.push(id);
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
  maxFov:110,
  minFov:60,
  smooth:0.17,
  movingRatio:0.3,
  autoRotation:0.0,
  rx:0,
  ry:0,
  minDetectDistance:20,
  onClick:onClick,
  onSpriteClick:onSpriteClick,
  sprites:sprites
});

function update() {
  requestAnimationFrame(update);
  snot.update();
  for (var i = 0; i < bullets_id.length; ++i) {
    var id = bullets_id[i];
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
      bullet.status = 0;
    }
    if (!bullet.steps) {
      snot.sprites[id].dist_x = snot.cameraLookAt.x * 30;
      snot.sprites[id].dist_y = snot.cameraLookAt.y * 30;
      snot.sprites[id].dist_z = snot.cameraLookAt.z * 30;
      bullet.x = snot.cameraLookAt.x,
      bullet.y = snot.cameraLookAt.y,
      bullet.z = - snot.cameraLookAt.z -3;
      bullet.status = -1;
    } else {
      snot.updateSpritePosition(id, bullet.x + bullet.step_x, bullet.y + bullet.step_y, bullet.z + bullet.step_z);
      bullet.steps --;
    }
  }
}
update();

//snot.run();
