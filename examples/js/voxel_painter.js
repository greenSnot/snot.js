var util = snot.util;
var THREE = snot.THREE;

var grid;

function set_color_from_intersects(intersects, color) {
  for (var i = 0; i < intersects.length; ++i) {
    if (intersects[i].object.name == 'grid') {
      intersects[i].face.color.set(color);
      grid.geometry.colorsNeedUpdate = true;
    }
  }
}

function on_touch_move(e, x, y, point, intersects) {
  var random_color_range = 0.3;
  var random_color = new THREE.Color().setRGB(0.5 + Math.random() * random_color_range,
      0.3 + Math.random * random_color_range,
      0 + Math.random * random_color_range);
  set_color_from_intersects(intersects, random_color);
}

function on_touch_start(e, x, y, point, intersects) {
  if (e.touches.length > 1) {
    return;
  }
  var random_color_range = 0.3;
  var random_color = new THREE.Color().setRGB(0.5 + Math.random() * random_color_range,
      0.3 + Math.random * random_color_range,
      0 + Math.random * random_color_range);
  set_color_from_intersects(intersects, random_color);
}

snot.init({
  size: 1024,
  gyro: true,
  clicks_depth: 1024 / 2.5,
  fov: 90,
  max_fov: 110,
  min_fov: 40,
  mouse_sensitivity: 0.3,
  auto_rotation: 0.0,
  rx: 0,
  ry: 0,
  on_touch_move: on_touch_move,
  on_touch_start: on_touch_start,
  raycaster_on_touch_move: true,
  raycaster_on_touch_start: true,
  sprites: [
    {
      id: 'grid',
      mesh_generator: function () {
        grid = new THREE.Mesh(
          new THREE.IcosahedronGeometry(300, 5),
          new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, side: THREE.DoubleSide})
        );
        return grid;
      },
      x: 0,
      y: 0,
      z: 0
    }
  ]
});

snot.run();
