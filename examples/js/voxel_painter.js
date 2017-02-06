var util = snot.util;
var THREE = snot.THREE;

var triangle_net;
var last_x;
var last_y;
var current_color = new THREE.Color();

function set_color_from_intersects(intersects, color) {
  for (var i = 0; i < intersects.length; ++i) {
    if (intersects[i].object.name === 'triangle_net') {
      intersects[i].face.color.set(color);
      triangle_net.geometry.colorsNeedUpdate = true;
      return;
    }
  }
}

function get_color() {
  var random_color_range = 0.3;
  var random_color = new THREE.Color().setRGB(current_color.r + Math.random() * random_color_range,
      current_color.g + Math.random() * random_color_range,
      current_color.b + Math.random() * random_color_range);
  return random_color;
}

function on_touch_move(e, x, y, point, intersects) {
  set_color_from_intersects(intersects, get_color());
  var distance_to_last = util.distance2D(last_x, last_y, x, y);
  if (distance_to_last > 80) {
    var min_offset = 15;
    var steps = Math.floor(distance_to_last / min_offset);

    var i = x;
    var i_end = last_x;
    var j = y;
    var j_end = last_y;

    var offset_i = (i_end - i) / steps;
    var offset_j = (j_end - j) / steps;
    for (var k = 0; k < steps; ++k) {
      intersects = snot.raycaster_from_mouse(i, j);
      set_color_from_intersects(intersects, get_color());
      i += offset_i;
      j += offset_j;
    }

  }
  last_x = x;
  last_y = y;
}

function on_touch_start(e, x, y, point, intersects) {
  if (e.touches.length > 1) {
    return;
  }
  last_x = x;
  last_y = y;
  set_color_from_intersects(intersects, get_color());
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
  fisheye_offset: 30,
  on_touch_start: on_touch_start,
  raycaster_on_touch_move: true,
  raycaster_on_touch_start: true,
  sprites: [
    {
      id: 'triangle_net',
      mesh_generator: function () {
        triangle_net = new THREE.Mesh(
          new THREE.IcosahedronGeometry(100, 5),
          new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, side: THREE.DoubleSide})
        );
        return triangle_net;
      },
      x: 0,
      y: 0,
      z: 0
    }, {
      id: 'auxiliary_triangle_net',
      mesh_generator: function () {
        return new THREE.Mesh(
          new THREE.IcosahedronGeometry(99, 5),
          new THREE.MeshBasicMaterial({wireframe: true, color: 0x666666, opacity: 0.4, side: THREE.DoubleSide})
        );
      },
      visible: false,
      x: 0,
      y: 0,
      z: 0
    }, {
      id: 'auxiliary_sphere_net',
      mesh_generator: function () {
        return new THREE.Mesh(
          new THREE.SphereGeometry(90, 32, 32),
          new THREE.MeshBasicMaterial({wireframe: true, color: 0x666666, opacity: 0.4, side: THREE.DoubleSide})
        );
      },
      visible: true,
      x: 0,
      y: 0,
      z: 0
    }
  ]
});

var fps_dom = document.getElementsByClassName('fps')[0];
var update_time_arr = [];
function update_fps() {
  var now = new Date().valueOf();
  for (var t = 0; t < update_time_arr.length; ++t) {
    if (update_time_arr[t] < now - 1000) {
      update_time_arr.splice(t, 1);
      t--;
    }
  }
  update_time_arr.push(now);
  fps_dom.innerHTML = update_time_arr.length;
}

function update() {
  update_fps();
  snot.update();
  requestAnimationFrame(update);
}
update();

var palette_dom = document.getElementsByClassName('palette')[0];

function add_color(color) {
  var dom = document.createElement('div');
  dom.setAttribute('class', 'palette-color');
  dom.setAttribute('style', 'background-color:#' + color);
  dom.setAttribute('data-color', color);
  dom.addEventListener('click', function() {
    var color = parseInt(this.getAttribute('data-color'), 16);
    current_color.setHex(color);
  });
  palette_dom.append(dom);
}

function init_palette() {
  var c = new THREE.Color();
  for (var i = 0.3; i < 1; i+= 0.1) {
    c.setHSL(0, 1, i);
    add_color(c.getHex().toString(16));
  }
  current_color.setRGB(0.5, 0.3, 0);
}

init_palette();
