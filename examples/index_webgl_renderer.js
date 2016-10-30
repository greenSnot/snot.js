function spot_generator(spot) {
  var size = 40;
  var loader = THREE.ImageUtils;
  var geometry = new THREE.PlaneGeometry(size, size);
  spotType2code = {
    straight: 0,
    left: 1,
    right: 2
  };

  var material = new THREE.MeshBasicMaterial({
    transparent:true,
    map: loader.loadTexture('http://7xiljm.com1.z0.glb.clouddn.com/images/tools/spot' + spotType2code[spot.spotType] + '.png?imageMogr2/gravity/NorthWest/crop/!128x128a0a0/interlace/0/thumbnail/!100p',THREE.UVMapping)
  } );

  var mesh = new THREE.Mesh( geometry, material );

  var rotation = snot.util.position_to_rotation(spot.x, spot.z, spot.y);

  rotation.ry = 270 - rotation.ry;
  rotation.ry = rotation.ry < 0 ? rotation.ry + 360 : rotation.ry;
  mesh.rotation.y = rotation.ry * Math.PI / 180;
  mesh.position.set(spot.x, spot.y, spot.z);

  var text = snot.generator.text(spot.x * 0.99, spot.y + 12, spot.z * 0.99, spot.text, 180);
  //snot.scene.add(text);
  return mesh;
}

function on_sprite_click(data) {
  console.log(data);
  alert('on_sprite_click');
}

function on_click(x, y, z, rx, ry) {
  snot.load_sprites([{
    //For CSS Renderer
    //TemplateId for template renderer
    template: 'template-spot',

    spriteType: 'spot',

    spotType: 'right',
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
    spotType: 'left',
    id: 'spot1',
    text: 'Home',
    x: 4,
    y: 120,
    z: 360
  }, 'spot2': {
    template: 'template-spot',
    spriteType: 'spot',
    spotType: 'straight',
    id: 'spot2',
    text: 'Garage',
    x: 400,
    y: 0,
    z: -110
  }
};

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
  generator:{
    spot: spot_generator
  },
  bg_rotation: [0, 0, 0, 0, 0, 0],
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

snot.run();
