!function(global) {

  global.snot = {};

  global.snot.util = {
    left_pos: left_pos,
    top_pos: top_pos,
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
    webgl_check: webgl_check,
    load_js: load_js,
    rotation_to_position: rotation_to_position
  };

  function top_pos(elem) {
    var curtop = 0;
    if (elem.offsetParent) {
      do { 
          curtop +=elem.offsetTop; 
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
  
  function webgl_check(return_context) {
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
}(window);
