function on_sprite_click(data) {
  console.log(data);
  alert('on_sprite_click');
}

function on_click(point, rotation) {
  snot.load_sprites([{
    generator: 'spot',
    id: 'spot-' + 123,
    x: point.x * 4,
    y: point.y * 4,
    z: point.z * 4,

    text: 'haha',
    spotType: 'right',
  }]);
}

var sprites = {
  '-x-axis': {
    generator: 'spot',
    id: '-x',
    x: - 360,
    y: 0,
    z: 0,

    spotType: 'left',
    text: '-x',
  },
  '-z-axis': {
    generator: 'spot',
    id: '-z',
    z: - 360,
    x: 0,
    y: 0,

    spotType: 'left',
    text: '-z',
  },
  '-y-axis': {
    generator: 'spot',
    id: '-y',
    y: - 360,
    x: 0,
    z: 0,

    spotType: 'left',
    text: '-y',
  },
  'x-axis': {
    generator: 'spot',
    id: 'x',
    x: 360,
    y: 0,
    z: 0,

    spotType: 'left',
    text: 'x',
  },
  'y-axis': {
    generator: 'spot',
    id: 'y',
    x: 0,
    y: 360,
    z: 0,

    spotType: 'left',
    text: 'y',
  },
  'z-axis': {
    generator: 'spot',
    id: 'z',
    x: 0,
    y: 0,
    z: 360,

    spotType: 'left',
    text: 'z',
  },
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
  debug: true,
  bg_size: 1248,
  bg_imgs: [
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
