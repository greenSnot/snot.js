var util = snot.util;
var THREE = snot.THREE;

function brush_triangle(point) {
  var loader = THREE.ImageUtils;
  var scale = 1;
  var size = 20;

  var triangle_shape = new THREE.Shape();
  var triangle_lt = {
    x: - 0.5 * size,
    y: Math.pow(3, 0.5) / 4 * size,
  };
  triangle_shape.moveTo(triangle_lt.x, triangle_lt.y);
  triangle_shape.lineTo(- triangle_lt.x, triangle_lt.y);
  triangle_shape.lineTo(0, - triangle_lt.y);
  triangle_shape.lineTo(triangle_lt.x, triangle_lt.y);

  var color = Math.ceil(Math.random() * 0x8080f0);
  triangle_shape.autoClose = true;
  var points = triangle_shape.createPointsGeometry();
  var spacedPoints = triangle_shape.createSpacedPointsGeometry(50);
  //var geo = new THREE.Line(points, new THREE.LineBasicMaterial({color: color, linewidth: 3}));
  //var geo = new THREE.Points(points, new THREE.PointsMaterial({color: color, size: 4}));
  var geo = new THREE.Points(spacedPoints, new THREE.PointsMaterial({color: color, size: 4, transparent: true, opacity: 0.5}));
  geo.position.set(point.x, point.y, point.z);
  geo.lookAt(new THREE.Vector3(0, 0, 0));
  geo.scale.set(scale, scale, scale);

  return geo;
}

var last_strip_vertex;
function brush_strip(point) {
  point = new THREE.Vector3(point.x, point.y, point.z);
  if (!last_strip_vertex) {
    last_strip_vertex = point.clone();
  }
  var color = 0x553300;
  var scale = 1;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(point);
  geometry.vertices.push(last_strip_vertex);
  var material = new THREE.LineBasicMaterial({color: color, opacity: 1, blending: THREE.AdditiveBlending, transparent: true});
  var mesh = new THREE.Line(geometry, material);

  last_strip_vertex = point;
  return mesh;
}

function on_touch_move(e, point) {
  snot.load_sprites([{
    //generator: 'brush_strip',
    generator: 'brush_triangle',

    spotType: 'right',
    id: 'spot-' + Math.random(),
    text: 'haha',
    x: point.x,
    y: point.y,
    z: point.z
  }]);
}

function on_touch_end(e) {
  last_strip_vertex = undefined;
}

snot.init({
  debug: true,
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
  raycaster_on_touch_move: true,
});

snot.run();
