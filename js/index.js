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


snot.run();
