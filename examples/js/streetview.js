var viewer = new snot({
  size: 1248,
  quality: 0.9,
  auto_rotation: 0.1,
  bg_imgs: [
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
    'images/test.png',
  ],
  rx: 0,
  ry: 0,
  on_click: on_click,
  sprite_on_click: sprite_on_click,
});

function sprite_on_click(data) {
  console.log(data);
  alert('sprite_on_click');
}

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  viewer.gyro = !viewer.gyro;
});

function spot_generator() {
  return '' +
    '<div class="spot-' + this.spotType + '">' +
      '<div class="spot-description">' + this.text + '</div>' +
      '<img class="spot-image" src="images/' + this.spotType + '.png"/>' +
    '</div>';
}

function on_click(point, rotation) {
  viewer.add_sprites([{
    mesh_generator: spot_generator,
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
    mesh_generator: spot_generator,
    id: '-x-axis',
    x: - 360,
    y: 0,
    z: 0,

    spotType: 'left',
    text: '-x',
  },
  '-z-axis': {
    mesh_generator: spot_generator,
    id: '-z-axis',
    z: - 360,
    x: 0,
    y: 0,

    spotType: 'left',
    text: '-z',
  },
  '-y-axis': {
    mesh_generator: spot_generator,
    id: '-y-axis',
    y: - 360,
    x: 0,
    z: 0,

    spotType: 'left',
    text: '-y',
  },
  'x-axis': {
    mesh_generator: spot_generator,
    id: 'x-axis',
    x: 360,
    y: 0,
    z: 0,

    spotType: 'left',
    text: 'x',
  },
  'y-axis': {
    mesh_generator: spot_generator,
    id: 'y-axis',
    x: 0,
    y: 360,
    z: 0,

    spotType: 'left',
    text: 'y',
  },
  'z-axis': {
    mesh_generator: spot_generator,
    id: 'z-axis',
    x: 0,
    y: 0,
    z: 360,

    spotType: 'left',
    text: 'z',
  },
  'spot1': {
    mesh_generator: spot_generator,
    id: 'spot1',
    x: 4,
    y: 120,
    z: 360,

    spotType: 'left',
    text: 'Home',
  }, 'spot2': {
    mesh_generator: spot_generator,
    id: 'spot2',
    x: 400,
    y: 0,
    z: -110,

    text: 'Garage',
    spotType: 'left',
  }
};

viewer.add_sprites(sprites);
viewer.run();
