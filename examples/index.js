function on_sprite_click(data) {
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

    text: 'haha',
    spotType: 'right',
    spriteType: 'spot',
  }]);
}

var sprites = {
  'spot1': {
    generator: 'spot',
    id: 'spot1',
    x: 4,
    y: 120,
    z: 360,

    spotType: 'left',
    text: 'Home',
  }, 'spot2': {
    generator: 'spot',
    id: 'spot2',
    x: 400,
    y: 0,
    z: -110,

    text: 'Garage',
    spotType: 'straight',
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
  generator: {
    spot: 'template-spot'
  },
  rx: 0,
  ry: 0,
  on_click: on_click,
  on_sprite_click: on_sprite_click,
  sprites: sprites
});

snot.run();
