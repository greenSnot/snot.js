var viewer = new Snot({
  size: 1024,
  clicks_depth: 1024 / 2.5,
  //bg_imgs: [
  //  'images/test.png',
  //  'images/test.png',
  //  'images/test.png',
  //  'images/test.png',
  //  'images/test.png',
  //  'images/test.png',
  //],
  bg_imgs: [
    'images/forrest.jpg',
  ],
  bg_rotation: [0, 0, 0, 0, 0, 0],
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.1,
  rx: 0,
  ry: 0,
  min_detect_distance: 20,
  on_click: on_click,
  sprite_on_click: sprite_on_click,
  sprites: sprites
});

var util = Snot.util;
var THREE = Snot.THREE;

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  viewer.gyro = !viewer.gyro;
});

function text_generator(data) {
  var text = data.text;
  var size = data.size;
  var color = data.color;
  var rate = 8;

  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var ch = parseInt(canvas.height);
  var cw = parseInt(canvas.width);
  function drawCanvas(text, size) {
    context = canvas.getContext('2d');
    context.font = size + 'px STHeiti';
    if (!color) {
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 5;
      context.shadowBlur = 20;
      context.shadowColor = 'rgba(0, 0, 0, 1)';
      context.fillStyle = '#fff';
    } else {
      context.fillStyle = color;
    }
    context.textAlign = 'center';
    context.textBaseline = 'middle';
  }
  drawCanvas(text, size);
  canvas.width = parseInt(context.measureText(text).width + 10);
  ch = parseInt(canvas.height);
  cw = parseInt(canvas.width);
  drawCanvas(text, size);
  context.fillText(text, cw / 2, ch / 2);

  var geom = new THREE.PlaneGeometry(cw / rate, ch / rate);
  var cTexture = new THREE.Texture(canvas);
  var mat = new THREE.MeshBasicMaterial({map: cTexture, transparent: true, overdraw: 1});
  cTexture.needsUpdate = true;
  var mesh = new THREE.Mesh(geom, mat);

  return mesh;
}

function spot_generator() {
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
    map: loader.loadTexture('http://7xiljm.com1.z0.glb.clouddn.com/images/tools/spot' + spotType2code[this.spotType] + '.png?imageMogr2/gravity/NorthWest/crop/!128x128a0a0/interlace/0/thumbnail/!100p',THREE.UVMapping)
  } );

  var mesh = new THREE.Mesh( geometry, material );

  mesh.position.set(this.x, this.y, this.z);
  mesh.lookAt(new THREE.Vector3(0, 0, 0));

  var text = text_generator({
    id: 'x',
    text: this.text,
    size: 120,
  });
  text.position.set(1, 12, 1);
  mesh.add(text);
  mesh.scale.x = 2;
  mesh.scale.y = 2;
  return mesh;
}

function sprite_on_click(data) {
  console.log(data);
  alert('sprite_on_click');
}

function on_click(point, rotation) {
  viewer.add_sprites([{
    mesh_generator: spot_generator,

    spotType: 'right',
    id: 'spot-' + Math.random(),
    text: 'haha',
    x: point.x,
    y: point.y,
    z: point.z
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
    spotType: 'left',
    id: 'spot1',
    text: 'Home',
    x: 4,
    y: 120,
    z: 360
  }, 'spot2': {
    mesh_generator: spot_generator,
    spotType: 'straight',
    id: 'spot2',
    text: 'Garage',
    x: 400,
    y: 0,
    z: -110
  }
};

viewer.run();
