var viewer1 = new Snot({
  size: 1024,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  on_click: v1_on_click,
  sprite_on_click: sprite_on_click,
  dom      : document.getElementById('viewer1-wrap'),
  container: document.getElementById('viewer1-container'),
  sprites: {}
});

var viewer2 = new Snot({
  size: 1024,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  on_click: v2_on_click,
  sprite_on_click: sprite_on_click,
  dom      : document.getElementById('viewer2-wrap'),
  container: document.getElementById('viewer2-container'),
  sprites: {}
});

var util = Snot.util;
var THREE = Snot.THREE;

document.getElementsByClassName('btn-gyro')[0].addEventListener('click', function() {
  viewer1.gyro = !viewer1.gyro;
  viewer2.gyro = !viewer2.gyro;
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

function v1_on_click(point, rotation) {
  viewer1.add_sprites([{
    mesh_generator: spot_generator,

    spotType: 'right',
    id: 'spot-' + Math.random(),
    text: 'haha',
    x: point.x,
    y: point.y,
    z: point.z
  }]);
}

function v2_on_click(point, rotation) {
  viewer2.add_sprites([{
    mesh_generator: spot_generator,

    spotType: 'right',
    id: 'spot-' + Math.random(),
    text: 'haha',
    x: point.x,
    y: point.y,
    z: point.z
  }]);
}

viewer1.run();
viewer2.run();
