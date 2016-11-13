!function(global) {

  if (global.template) {
    global.template.config('openTag','<#');
    global.template.config('closeTag','#>');
  }

  global.snot = {};

  global.snot.util = {
    left_pos: left_pos,
    top_pos: top_pos,
    standardlization: standardlization,
    is_mobile: is_mobile,
    is_wechat_login: is_wechat_login,
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

    merge_json: merge_json,
    octree_collision: octree_collision,

  };

  function top_pos(elem) {
    var curtop = 0;
    if (elem.offsetParent) {
      do { 
          curtop += elem.offsetTop; 
      } while (elem = elem.offsetParent);
    }
    return curtop;
  };

  function left_pos(elem) {
    var curleft = 0;
    if (elem.offsetParent) {
        do { 
            curleft += elem.offsetLeft; 
        } while (elem = elem.offsetParent);
    }
    return curleft;
  };
  
  function is_mobile() {
    return get_window_width() < 500;
  }
  
  function is_wechat_login() {
    return window.navigator.userAgent.indexOf('MicroMessenger') >= 0 ? true : false;
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
    return Math.pow((a - d) * (a - d) + (b - e) * (b - e) + (c - f) * (c - f), 0.5);
  }
  
  function epsilon(value) {
    return Math.abs(value) < 0.000001 ? 0 : value.toFixed(5);
  };
  
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
      }
    } else {
      //ie6、ie7 support js.onreadystatechange
      js.onReadyStateChange = function () {
        if (js.readyState == 'loaded' || js.readyState == 'complete') {
          callback();
        }
      }
    }
  }
  
  function rotation_to_position(z, rx, ry, rz) {
    z = - z;
    rx = - rx;
  
    var x = snot.bg_size / 2;
    var y = snot.bg_size / 2;
  
    var transform = css_text_to_matrix('translate3d(' + x + 'px,' + y + 'px,0) rotateY(' + (0) + 'deg) rotateX(' + (0) + 'deg) rotateY(' + (ry ? - ry : 0) + 'deg) rotateX(' + (rx ? - rx : 0) + 'deg) rotateZ(' + (rz ? rz : 0) +'deg) translateZ(' + z + 'px)' );
    return [ - transform[12] + snot.bg_size / 2, transform[13] - snot.bg_size / 2, - transform[14]];
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

  function merge_json(obj, json) {
    for (var i in json) {
      if (obj[i] == undefined) {
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
  }

  function is_point_inside(point, a, b) {
    if (point.x >= b.x && point.y >= b.y && point.z >= b.z &&
        point.x < a.x && point.y < a.y && point.z < a.z) {
      return true;
    }
    return false;
  }
  function get_inside_points(points, a, b) {
    let candidates = [];
    for (let i in points) {
      if (is_point_inside(points[i], a, b)) {
        candidates.push(points[i]);
      }
    }
    return candidates;
  }
  /*
   * see ../images/octree.png
   *
   * a.x > b.x
   * a.y > b.y
   * a.z > b.z
   */
  function octree_collision(a, b, points_a, points_b, res, depth = 1) {
    if (!points_a.length || !points_b.length) {
      return false;
    }
    if (depth > 7) {
      res.push({
        points_a: points_a,
        points_b: points_b,
      });
      return true;
    }

    // random split
    let half = {
      x: (a.x - b.x) / (Math.random() * 0.2 - 0.1 + 2),
      y: (a.y - b.y) / (Math.random() * 0.2 - 0.1 + 2),
      z: (a.z - b.z) / (Math.random() * 0.2 - 0.1 + 2),
    };
    let b_xyz = {
      x: b.x + half.x,
      y: b.y + half.y,
      z: b.z + half.z,
    };
    let b_x = {
      x: b_xyz.x,
      y: b.y,
      z: b.z,
    };
    let b_y = {
      x: b.x,
      y: b_xyz.y,
      z: b.z,
    };
    let b_z = {
      x: b.x,
      y: b.y,
      z: b_xyz.z,
    };
    let b_xz = {
      x: b_xyz.x,
      y: b.y,
      z: b_xyz.z,
    };
    let b_xy = {
      x: b_xyz.x,
      y: b_xyz.y,
      z: b.z,
    };
    let b_yz = {
      x: b.x,
      y: b_xyz.y,
      z: b_xyz.z,
    };

    let a_z = {
      x: a.x,
      y: a.y,
      z: a.z - half.z,
    };
    let a_x = {
      x: a.x - half.x,
      y: a.y,
      z: a.z,
    };
    let a_y = {
      x: a.x,
      y: a.y - half.y,
      z: a.z,
    };
    let a_xy = {
      x: a_x.x,
      y: a_y.y,
      z: a.z,
    };
    let a_yz = {
      x: a.x,
      y: a_y.y,
      z: a_z.z,
    };
    let a_xz = {
      x: a_x.x,
      y: a.y,
      z: a_z.z,
    };

    function sub_collision(a, b) {
      let candidates_a = get_inside_points(points_a, a, b);
      let candidates_b = get_inside_points(points_b, a, b);
      return octree_collision(a, b, candidates_a, candidates_b, res, depth + 1);
    }

    let pairs = [
      [a_x, b_yz],
      [a, b_xyz],
      [a_xy, b_z],
      [a_y, b_xz],

      [a_xz, b_y],
      [a_z, b_xy],
      [b_xyz, b],
      [a_yz, b_x],
    ];

    let found = false;
    for (let i in pairs) {
      if (sub_collision(pairs[i][0], pairs[i][1])) {
        found = true;
      }
    }

    return found;
  }

}(window);
