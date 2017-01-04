var util = snot.util;
var THREE = snot.THREE;

var color, depth = 300, range = 3;
function brush_triangle(data) {
  var point = new THREE.Vector3(data.x, data.y, data.z);
  var size = 20;

  point.x += Math.random() * range - range;
  point.y += Math.random() * range - range;
  point.z += Math.random() * range - range;
  util.standardlization(point, depth);
  depth -= 0.2;

  var geo = new THREE.Geometry();
  geo.vertices.push(vertex_a);
  geo.vertices.push(vertex_b);
  geo.vertices.push(point);

  geo.faces.push(new THREE.Face3(0, 1, 2 ));
  geo.computeFaceNormals();

  var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: color - Math.random() * 1000, transparent: true, opacity: 0.8, side: THREE.DoubleSide}));

  vertex_a = snot.frames % 2 == 0? vertex_b : vertex_a;
  vertex_b = point;

  return mesh;
}

var vertex_a, vertex_b;

var strip_head;
function brush_strip(data) {
  var point = new THREE.Vector3(data.x, data.y, data.z);
  var color = 0x553300;
  var scale = 1;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(point);
  geometry.vertices.push(strip_head);
  var material = new THREE.LineBasicMaterial({color: color, opacity: 1, blending: THREE.AdditiveBlending, transparent: true});
  var mesh = new THREE.Line(geometry, material);

  strip_head = point;
  return mesh;
}

var last_x, last_y;
function on_touch_move(e, x, y, point) {
  range = util.distance2D(x, y, last_x, last_y) + 10;
  last_x = x;
  last_y = y;

  snot.add_sprites([{
    //generator: 'brush_strip',
    generator: 'brush_triangle',

    id: 'spot-' + Math.random(),
    x: point.x,
    y: point.y,
    z: point.z
  }]);
}

function on_touch_end(e) {
  strip_head = undefined;
}

function on_touch_start(e, x, y, point) {
  last_x = x;
  last_y = y;
  strip_head = point.clone();

  color = Math.ceil(Math.random() * 0xffffff);
  var range = 20;
  vertex_a = point.clone();
  vertex_b = point.clone();
  function make_bias(v) {
    v.x += Math.random() * range - range;
    v.y += Math.random() * range - range;
    v.z += Math.random() * range - range;
    util.standardlization(v, depth);
  }
  make_bias(vertex_a);
  make_bias(vertex_b);
}

snot.init({
  size: 1024,
  gyro: true,
  clicks_depth: 1024 / 2.5,
  bg_imgs: [
    'images/forrest.jpg',
  ],
  generator: {
    brush_triangle: brush_triangle,
    brush_strip: brush_strip,
  },
  fov: 90,
  max_fov: 110,
  min_fov: 60,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  on_touch_move: on_touch_move,
  on_touch_end: on_touch_end,
  on_touch_start: on_touch_start,
  raycaster_on_touch_move: true,
  raycaster_on_touch_start: true,
});

snot.run();
