var THREE = require('three');
var FastClick = require('fastclick');
FastClick(document.body);

var util = {
  left_pos: left_pos,
  top_pos: top_pos,
  standardlization: standardlization,
  is_mobile: is_mobile,
  get_window_width: get_window_width,
  get_window_height: get_window_height,
  position_to_rotation: position_to_rotation,
  distance2D: distance2D,
  distance3D: distance3D,
  epsilon: epsilon,
  css_text_to_matrix: css_text_to_matrix,
  matrix_to_css_text: matrix_to_css_text,
  webgl_detect: webgl_detect,
  webgl_enabled: webgl_detect(),
  load_js: load_js,
  rotation_to_position: rotation_to_position,

  v_set_from_matrix_position: v_set_from_matrix_position,
  m_make_rotation_axis: m_make_rotation_axis,
  m_multiply: m_multiply,
  m_set_position: m_set_position,
  m_make_rotation_from_quaternion: m_make_rotation_from_quaternion,

  collision_test: collision_test,
  merge_json: merge_json,
  clone: clone,
};
module.exports = util;

function top_pos(elem) {
  var curtop = 0;
  if (elem.offsetParent) {
    do {
      curtop += elem.offsetTop;
      elem = elem.offsetParent;
    } while (elem);
  }
  return curtop;
}

function left_pos(elem) {
  var curleft = 0;
  if (elem.offsetParent) {
    do {
      curleft += elem.offsetLeft;
      elem = elem.offsetParent;
    } while (elem);
  }
  return curleft;
}

function is_mobile() {
  var agent = window.navigator.userAgent.toLowerCase();
  return agent.indexOf('ipad') > 0 || agent.indexOf('iphone') > 0 || agent.indexOf('android') > 0;
}

function get_window_width() {
  return document.documentElement.clientWidth;
}

function get_window_height() {
  return document.documentElement.clientHeight;
}

function position_to_rotation(x, y, z) {
  var r = distance3D(x, y, z, 0, 0, 0);
  var rx = Math.asin(z / r);
  var ry = Math.asin(y / r / Math.cos(rx));
  if (x < 0) {
    ry = ry > 0 ? Math.PI - ry : - Math.PI - ry;
  }

  return {
    rx: - rx * 180 / Math.PI,
    ry: (ry < 0 ? ry + Math.PI * 2 : ry) * 180 / Math.PI
  };
}

function distance2D(a, b, c, d) {
  return Math.pow((a - c) * (a - c) + (b - d) * (b - d), 0.5);
}

function distance3D(a, b, c, d, e, f) {
  if (typeof(a) == 'object') {
    var diff_x = a.x - b.x;
    var diff_y = a.y - b.y;
    var diff_z = a.z - b.z;
    return Math.pow(diff_x * diff_x + diff_y * diff_y + diff_z * diff_z, 0.5);
  }
  return Math.pow((a - d) * (a - d) + (b - e) * (b - e) + (c - f) * (c - f), 0.5);
}

function epsilon(value) {
  return Math.abs(value) < 0.000001 ? 0 : value.toFixed(5);
}

function css_text_to_matrix(t) {
  var m = new WebKitCSSMatrix(t);
  return [
    epsilon(m.m11), epsilon(m.m12), epsilon(m.m13), epsilon(m.m14),
    epsilon(m.m21), epsilon(m.m22), epsilon(m.m23), epsilon(m.m24),
    epsilon(m.m31), epsilon(m.m32), epsilon(m.m33), epsilon(m.m34),
    epsilon(m.m41), epsilon(m.m42), epsilon(m.m43), epsilon(m.m44)
  ];
}

function matrix_to_css_text(a, b, c, d,
  e, f, g, h,
  i, j, k, l,
m, n, o, p) {
  if (typeof(a) == 'object') {
    return 'matrix3d(' + (a.join(',')) + ')';
  }
  return 'matrix3d(' + a + ',' + b + ',' + c + ',' + d+',' + e + ',' + f + ',' + g + ',' + h + ',' + i + ',' + j + ',' + k + ',' + l + ',' + m + ',' + n + ',' + o+ ',' + p + ')';
}

window.requestAnimationFrame= (function () { 
  return window.requestAnimationFrame || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame || 
  window.oRequestAnimationFrame || 
  // if all else fails, use setTimeout 
  function (callback) { 
    return window.setTimeout(callback, 1000 / 60); // shoot for 60 fps 
  }; 
})(); 

function webgl_detect(return_context) {
  if (!!window.WebGLRenderingContext) {
    var canvas = document.createElement("canvas");
    var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
    var context = false;

    for (var i = 0;i < 4; i++) {
      try {
        context = canvas.getContext(names[i]);
        if (context && typeof context.getParameter == 'function') {
          // WebGL is enabled
          if (return_context) {
            // return WebGL object if the function's argument is present
            return {
              name: names[i],
              gl: context
            };
          }
          // else, return just true
          return true;
        }
      } catch(e) {}
    }

    // WebGL is supported, but disabled
    return false;
  }

  // WebGL not supported
  return false;
}

function load_js(file, callback) {
  var _doc = document.getElementsByTagName('head')[0];
  var js = document.createElement('script');
  js.setAttribute('type', 'text/javascript');
  js.setAttribute('src', file);
  _doc.appendChild(js);
  if (!/*@cc_on!@*/0) { //if not ie
    //firefox2、firefox3、safari3.1+、opera9.6+ support js.onload
    js.onload = function () {
      callback();
    };
  } else {
    //ie6、ie7 support js.onreadystatechange
    js.onReadyStateChange = function () {
      if (js.readyState == 'loaded' || js.readyState == 'complete') {
        callback();
      }
    };
  }
}

function rotation_to_position(z, rx, ry, rz) {
  return v_set_from_matrix_position(m_multiply(
    m_make_rotation_axis({x: 1, y: 0, z: 0}, - rx * Math.PI / 180),
    m_make_rotation_axis({x: 0, y: 1, z: 0}, - ry * Math.PI / 180),
    new THREE.Matrix4().setPosition({x: 0, y: 0, z: z})
  ));
}

function m_make_rotation_axis(point, rotation) {
  return new THREE.Matrix4().makeRotationAxis(point, rotation);
}

function m_multiply() {
  var mats = arguments;

  var l = mats.length;
  while (l > 1) {
    var last2 = mats[l - 2];
    var last1 = mats[l - 1];
    mats[l - 2] = new THREE.Matrix4().multiplyMatrices(
      last2,
      last1
    );
    l--;
  }
  return mats[0];
}

function v_set_from_matrix_position(mat4) {
  return new THREE.Vector3().setFromMatrixPosition(mat4);
}

function m_set_position(p) {
  return new THREE.Matrix4().setPosition(p);
}

function m_make_rotation_from_quaternion(q) {
  return new THREE.Matrix4().makeRotationFromQuaternion(q);
}

function merge_json(obj, json, override) {
  for (var i in json) {
    if (obj[i] === undefined || override) {
      obj[i] = json[i];
    }
  }
}

function standardlization(point, r) {
  r = r || 1;
  var distance_to_origin = distance3D(0, 0, 0, point.x, point.y, point.z);
  point.x *= r / distance_to_origin;
  point.y *= r / distance_to_origin;
  point.z *= r / distance_to_origin;
  return point;
}

/*
* see http://imgur.com/1HRG2fF
*
* a.x > b.x
* a.y > b.y
* a.z > b.z
*/
function collision_test(a, b, points_a, points_b, max_depth, random_factor) {
  max_depth = max_depth || 7;
  random_factor = random_factor || 0.2;
  var random_factor_half = random_factor / 2;
  var res = [];

  function is_point_inside(point, a, b) {
    if (point.x >= b.x && point.y >= b.y && point.z >= b.z &&
    point.x < a.x && point.y < a.y && point.z < a.z) {
      return true;
    }
    return false;
  }

  function get_inside_points(points, a, b) {
    var candidates = [];
    for (var i in points) {
      if (is_point_inside(points[i], a, b)) {
        candidates.push(points[i]);
      }
    }
    return candidates;
  }

  (function octree_collision_test(a, b, points_a, points_b, depth) {
    if (!points_a.length || !points_b.length) {
      return false;
    }
    if (depth > max_depth) {
      res.push({
        points_a: points_a,
        points_b: points_b,
      });
      return true;
    }

    // random split
    var half = {
      x: (a.x - b.x) / (Math.random() * random_factor - random_factor_half + 2),
      y: (a.y - b.y) / (Math.random() * random_factor - random_factor_half + 2),
      z: (a.z - b.z) / (Math.random() * random_factor - random_factor_half + 2),
    };
    var b_xyz = {
      x: b.x + half.x,
      y: b.y + half.y,
      z: b.z + half.z,
    };
    var b_x = {
      x: b_xyz.x,
      y: b.y,
      z: b.z,
    };
    var b_y = {
      x: b.x,
      y: b_xyz.y,
      z: b.z,
    };
    var b_z = {
      x: b.x,
      y: b.y,
      z: b_xyz.z,
    };
    var b_xz = {
      x: b_xyz.x,
      y: b.y,
      z: b_xyz.z,
    };
    var b_xy = {
      x: b_xyz.x,
      y: b_xyz.y,
      z: b.z,
    };
    var b_yz = {
      x: b.x,
      y: b_xyz.y,
      z: b_xyz.z,
    };

    var a_z = {
      x: a.x,
      y: a.y,
      z: a.z - half.z,
    };
    var a_x = {
      x: a.x - half.x,
      y: a.y,
      z: a.z,
    };
    var a_y = {
      x: a.x,
      y: a.y - half.y,
      z: a.z,
    };
    var a_xy = {
      x: a_x.x,
      y: a_y.y,
      z: a.z,
    };
    var a_yz = {
      x: a.x,
      y: a_y.y,
      z: a_z.z,
    };
    var a_xz = {
      x: a_x.x,
      y: a.y,
      z: a_z.z,
    };

    function sub_collision(a, b) {
      var candidates_a = get_inside_points(points_a, a, b);
      var candidates_b = get_inside_points(points_b, a, b);
      return octree_collision_test(a, b, candidates_a, candidates_b, depth + 1);
    }

    var pairs = [
      [a_x, b_yz],
      [a, b_xyz],
      [a_xy, b_z],
      [a_y, b_xz],

      [a_xz, b_y],
      [a_z, b_xy],
      [b_xyz, b],
      [a_yz, b_x],
    ];

    var found = false;
    for (var i in pairs) {
      if (sub_collision(pairs[i][0], pairs[i][1])) {
        found = true;
      }
    }

    return found;
  })(a, b, points_a, points_b, 1);
  return res;
}

function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || 'object' !== typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}
