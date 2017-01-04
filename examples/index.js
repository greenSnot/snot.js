function sprite_on_click(data) {
  console.log(data);
  alert('sprite_on_click');
}

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  snot.gyro = !snot.gyro;
});

function on_click(point, rotation) {
  snot.load_sprites([{
    generator: 'spot',
    id: 'spot-' + Math.random(),
    x: point.x,
    y: point.y,
    z: point.z,

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
  size: 1248,
  quality: 0.2,
  auto_rotation: 0.1,
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
  sprite_on_click: sprite_on_click,
  sprites: sprites
});

snot.run();
