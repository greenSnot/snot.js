var viewer = new Snot({
  size: 1024,
  gyro: true,
  clicks_depth: 1024 / 2.5,
  bg_imgs: [
    'images/forrest.jpg',
  ],
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

var util = Snot.util;
var THREE = Snot.THREE;

var color, depth = 300, random_range = 3;
function brush_triangle() {
  var point = new THREE.Vector3(this.x, this.y, this.z);
  var size = 20;

  point.x += Math.random() * random_range - random_range;
  point.y += Math.random() * random_range - random_range;
  point.z += Math.random() * random_range - random_range;
  util.standardlization(point, depth);

  var geo = new THREE.Geometry();
  geo.vertices.push(vertex_a);
  geo.vertices.push(vertex_b);
  geo.vertices.push(point);

  geo.faces.push(new THREE.Face3(0, 1, 2 ));
  geo.computeFaceNormals();

  var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: color - Math.random() * 1000, transparent: true, opacity: 0.8, side: THREE.DoubleSide}));

  vertex_a = viewer.frames % 2 === 0? vertex_b : vertex_a;
  vertex_b = point;

  return mesh;
}

var vertex_a, vertex_b;

var strip_head;
function brush_strip() {
  var point = new THREE.Vector3(this.x, this.y, this.z);
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

function on_touch_move(e, x, y, point, intersects) {

  random_range = util.distance2D(x, y, last_x, last_y) + 10;
  last_x = x;
  last_y = y;

  viewer.add_sprites([{
    //mesh_enerator: brush_strip,
    mesh_generator: brush_triangle,

    id: 'shape-' + Math.random(),
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
  var random_range = 20;
  vertex_a = point.clone();
  vertex_b = point.clone();
  function make_bias(v) {
    v.x += Math.random() * random_range - random_range;
    v.y += Math.random() * random_range - random_range;
    v.z += Math.random() * random_range - random_range;
    util.standardlization(v, depth);
  }
  make_bias(vertex_a);
  make_bias(vertex_b);
}

viewer.run();
