var viewer = new snot({
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
  fisheye_offset: - 30,
  on_touch_start: on_touch_start,
  raycaster_on_touch_move: true,
  raycaster_on_touch_start: true,
});

var util = viewer.util;
var THREE = viewer.THREE;

var triangle_net;
var current_color = new THREE.Color();
var triangle_net_kd;
var random_color_range = 0.1 * (Math.random() - 0.5 > 0 ? 1 : -1);

function set_color_from_intersects(intersects, color) {
  for (var i = 0; i < intersects.length; ++i) {
    if (intersects[i].object.name === 'triangle_net') {
      var neighbors = triangle_net_kd.nearest(intersects[i].face, 20);

      for (var j = 0; j < neighbors.length; ++j) {
        neighbors[j][0].color.set(get_color());
      }
      intersects[i].face.color.set(color);
      triangle_net.geometry.colorsNeedUpdate = true;
      return;
    }
  }
}

function get_color() {
  var random_color = new THREE.Color().setRGB(current_color.r + Math.random() * random_color_range,
      current_color.g + Math.random() * random_color_range,
      current_color.b + Math.random() * random_color_range);
  return random_color;
}

function on_touch_move(e, x, y, point, intersects) {
  set_color_from_intersects(intersects, get_color());
}

function on_touch_start(e, x, y, point, intersects) {
  if (e.touches.length > 1) {
    return;
  }
  set_color_from_intersects(intersects, get_color());
}

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
  viewer.update();
  requestAnimationFrame(update);
}
update();

var palette_dom = document.getElementsByClassName('palette')[0];

function add_color_btn(color, is_eraser) {
  var dom = document.createElement('div');
  dom.setAttribute('class', 'palette-color');
  dom.setAttribute('style', is_eraser ? 'background:#fff;border:1px solid #' + color : 'background-color:#' + color);
  dom.setAttribute('data-color', color);
  if (!is_eraser) {
    dom.addEventListener('click', function() {
      var color = parseInt(this.getAttribute('data-color'), 16);
      current_color.setHex(color);
      random_color_range = 0.1 * (Math.random() - 0.5 > 0 ? 1 : -1);
    });
  } else {
    dom.addEventListener('click', function() {
      random_color_range = 0;
      current_color.setRGB(1, 1, 1);
    });
  }
  palette_dom.append(dom);
}

function add_btn_more(color) {
  var dom = document.createElement('div');
  dom.innerHTML = '...';
  dom.setAttribute('class', 'btn-more');
  dom.setAttribute('style', 'color:#' + color);
  palette_dom.append(dom);
}

function init_palette() {
  var c = new THREE.Color();
  for (var i = 0.6; i < 0.9; i+= 0.1) {
    add_color_btn(c.setHSL(0, 0.8, i).getHex().toString(16));
  }
  add_color_btn(c.setHSL(0, 0.8, 0.9).getHex().toString(16), true);
  add_btn_more(c.setHSL(0, 1, 0.7).getHex().toString(16));
  current_color.setHSL(0, 1, 0.6);
}

init_palette();
var sprites = [
  {
    id: 'triangle_net',
    mesh_generator: function () {
      var geo = new THREE.IcosahedronGeometry(100, 5);
      triangle_net = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors, side: THREE.DoubleSide})
      );

      for (var i = 0;i < geo.faces.length; ++i) {
        var v1 = geo.vertices[geo.faces[i].a];
        var v2 = geo.vertices[geo.faces[i].b];
        var v3 = geo.vertices[geo.faces[i].c];

        geo.faces[i].x = (v1.x + v2.x + v3.x) / 3;
        geo.faces[i].y = (v1.y + v2.y + v3.y) / 3;
        geo.faces[i].z = (v1.z + v2.z + v3.z) / 3;
        geo.faces[i].index = i;
      }
      triangle_net_kd = new util.kd_tree(triangle_net.geometry.faces, function(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
      }, ['x', 'y', 'z']);
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
    visible: false,
    x: 0,
    y: 0,
    z: 0
  }
];
viewer.add_sprites(sprites);
