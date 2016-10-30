!function(global) {

  var dom_offset_top;
  var dom_offset_left;
  var snot = {

    camera_look_at: {
      x: 0,
      y: 0,
      z: 1,
    },
    mouse_sensitivity: 0.3,
    auto_rotation: 0,
    frames: 0,
    bg_rotation: [0, 0, 0, 0, 0, 0],

    pause_animation: false,

    dom      : document.getElementById('snot-wrap'),
    camera   : document.getElementById('snot-camera'),
    container: document.getElementById('snot-container'),

    bg_size: 1024,

    generator: {},
    gyro: false,
    ry: 0,        // Rotate * degree around y axis
    rx: 0,        // Rotate * degree around x axis
    max_fov: 120, // Max field of view (degree)
    min_fov: 60,   // Min field of view (degree)
    fov: 90,      // Default field of view
    smooth: 0.17,
    min_detect_distance: 20,
    on_click: function() {},
    on_sprite_click: function() {},
  }
  var prev_gyro;

  var PI = Math.PI;
  var sin = Math.sin;
  var cos = Math.cos;
  var tan = Math.tan;
  var acos = Math.acos;
  var atan = Math.atan;
  var pow = Math.pow;
  var floor = Math.floor;
  var sqrt = Math.sqrt;

  var dist_rx;
  var dist_ry;
  var previous_quat = new THREE.Quaternion();
  var screen_orientation = 0;
  var vars = {
    alpha: 0,
    beta: 90 * PI / 180,
    gamma: 0
  };

  var varsDest = {
    alpha: 0,
    beta: 0,
    gamma: 0
  };


  function _pointStandardlization(x, y, z) {
    var ratio = 200 / distance3D(x, y, z, 0, 0, 0);
    return [x * ratio, y * ratio, z * ratio];
  }

  if (global.snot) {
    for (var i in snot) {
      global.snot[i] = snot[i];
    }
    snot = global.snot;
  } else {
    console.error('snot-utils.js is missing');
    return;
  }
  var util = global.snot.util;
  var epsilon = util.epsilon;
  var distance3D = util.distance3D;
  var distance2D = util.distance2D;

  var set_fov = function (degree) {
    if (degree < snot.min_fov || degree > snot.max_fov) {
      return;
    }
    snot.fov = degree;
    snot.container.style['-webkit-transform'] = 'scale(' + tan(snot.max_fov / 2 * PI / 180) / tan(snot.fov / 2 * PI / 180) + ')';
  }

  function reset() {
    var sprites = document.getElementsByClassName('sprite');
    for (var i = 0; i < sprites.length; ++ i) {
      sprites[i].remove();
    }
  }

  var _init = function(config, ajax) {
    reset();

    cancelAnimationFrame(snot._animateId);

    for (var i in config) {
      if (i == 'generator') {
        merge_json(snot.generator, config.generator);
      }
      snot[i] = config[i];
    }
    prev_gyro = snot.gyro;

    dom_offset_left = util.left_pos(snot.dom);
    dom_offset_top = util.top_pos(snot.dom);

    dist_rx = snot.rx + 0.1; //unknown bug for mobile safari
    dist_ry = snot.ry;

    //First init
    if (!ajax) {

      snot.width = snot.dom.offsetWidth;
      snot.height = snot.dom.offsetHeight;

      //compute the max Horizontal Field of view
      //perspective= projectiveScreenWidth/2
      //           = width/2/tan(max_fov/2)
      snot.perspective = snot.width / 2 / tan(snot.max_fov / 2 * PI / 180);

      snot.container.style['-webkit-perspective'] = snot.perspective + 'px';

      //camera offset
      // Z is depth(front) Y is height X is right
      //
      // translateZ setFOV
      // rotateX rotate around X axis
      // rotateY rotate around Y axis
      // translateX translate the Camera to center
      // translateY
      snot.cameraBaseTransform = 'translateX(' + epsilon(- (snot.bg_size - snot.width) / 2) + 'px) translateY(' + epsilon(- (snot.bg_size - snot.height) / 2) + 'px)';
      snot.camera.style['-webkit-transform'] = 'translateZ(-' + snot.perspective + 'px) rotateX(' + snot.rx + 'deg) rotateY(' + snot.ry + 'deg)' + snot.cameraBaseTransform;
    }
    set_fov(snot.fov);

    if (config.bg_imgs) {
      load_bg_imgs(config.bg_imgs, config.bg_rotation || snot.bg_rotation);
    }

    if (config) {
      _load_sprites(config.sprites);
    }

    if (util.is_mobile()) {
      snot.container.addEventListener('touchstart', mouseDown, false);
      snot.container.addEventListener('touchmove' , mouseMove, false);
      snot.container.addEventListener('touchend'  , mouseUp  , false);
    } else {
      snot.container.addEventListener('mousedown' , mouseDown , false);
      snot.container.addEventListener('mousemove' , mouseMove , false);
      snot.container.addEventListener('mouseup'   , mouseUp   , false);
      snot.container.addEventListener('mousewheel', mouseWheel, false);
    }

    if (config.callback) {
      config.callback();
    }
  }

  function load_bg_imgs(bg_imgs, bg_rotation) {
    var bg_config = {
      front : 'rotateY(90deg)' + '                rotateZ(' + bg_rotation[0] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px)',
      bottom: 'rotateY(90deg)' + 'rotateX(90deg)  rotateZ(' + bg_rotation[1] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px) rotateZ(90deg)',
      left  : 'rotateY(90deg)' + 'rotateY(90deg)  rotateZ(' + bg_rotation[2] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px)',
      back  : 'rotateY(90deg)' + 'rotateY(180deg) rotateZ(' + bg_rotation[3] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px)',
      top   : 'rotateY(90deg)' + 'rotateX(-90deg) rotateZ(' + bg_rotation[4] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px) rotateZ(-90deg)',
      right : 'rotateY(90deg)' + 'rotateY(-90deg) rotateZ(' + bg_rotation[5] + 'deg)  translateZ(-' + (snot.bg_size / 2) + 'px)'
    };

    var bg_dom;
    var count = 0;
    for (var i in bg_config) {
      bg_dom = document.getElementsByClassName('snot-bg ' + i)[0];
      bg_dom.style['-webkit-transform'] = bg_config[i];
      bg_dom.style['width'] = snot.bg_size + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )
      bg_dom.style['height'] = snot.bg_size + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )

      bg_dom.setAttribute('src', bg_imgs[count]);
      bg_dom.setAttribute('data-index', count);
      ++count;
    }
  }

  var touches = {
    fx:0,   // First  finger x
    fy:0,   // First  finger y
    sx:0,   // Second finger x
    sy:0    // Second finger y
  };

  var _load_sprites = function(sprites) {
    for (var i in sprites) {
      var t = sprites[i];
      if (t.standardlization) {
        var standard = _pointStandardlization(t.x,t.y,t.z);
        t.x=standard[0];
        t.y=standard[1];
        t.z=standard[2];
      }

      var temp_wrapper = document.createElement('div');
      temp_wrapper.innerHTML = template(snot.generator[t.generator], t);
      var element = temp_wrapper.firstChild;
      element.data = sprites[i];
      add_sprite_by_position(element, t);
    }
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

  function add_sprite_by_position(element, p) {

    var x = p.x;
    var z = - p.z;
    var y = - p.y;

    var spriteContainer = document.createElement('div');
    spriteContainer.style.display = 'inline-block';
    spriteContainer.style.position = 'absolute';
    spriteContainer.className = 'sprite-container';
    spriteContainer.id = element.data.id;

    spriteContainer.style['-webkit-transform-origin-x'] = '0';
    spriteContainer.style['-webkit-transform-origin-y'] = '0';

    var arc = x == 0 && z == 0 ? 0 : acos( z / pow(x * x + z * z, 0.5));

    arc = x < 0 ? 2 * PI - arc : arc;
    arc = arc * 180 / PI;

    var r = distance3D(x, y, z, 0, 0, 0);
    x += snot.bg_size / 2;
    y += snot.bg_size / 2;

    spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - snot.bg_size / 2) / r * 90)+'deg) rotateY(180deg)';

    var spriteWrap = document.createElement('div');
    spriteWrap.className='sprite-wrap';
    spriteWrap.appendChild(element);
    spriteWrap.setAttribute('data-visible', element.data.visible == false ? false : true);

    spriteContainer.appendChild(spriteWrap);
    snot.camera.appendChild(spriteContainer);
  }

  var update_sprite_visibility = function(id) {
    var visible = snot.sprites[id].visible;
    var spriteContainer = document.getElementById(id);
    spriteContainer.firstChild.setAttribute('data-visible', visible ? true : false);
  }

  var update_sprite_position = function(id) {
    var x = snot.sprites[id].x;
    var y = snot.sprites[id].y;
    var z = snot.sprites[id].z;
    z=-z;
    y=-y;
    var arc = x == 0 && z == 0 ? 0 : acos( z / pow(x * x + z * z, 0.5));

    arc = x < 0 ? 2 * PI - arc : arc;
    arc = arc * 180/ PI;

    var r = distance3D(x, y, z, 0, 0, 0);
    x += snot.bg_size / 2;
    y += snot.bg_size / 2;

    var spriteContainer = document.getElementById(id);

    spriteContainer.style['-webkit-transform'] = 'translate3d(' + epsilon(x) + 'px,' + epsilon(y) + 'px,' + epsilon(z) + 'px) rotateY(' + epsilon(arc) + 'deg) rotateX(' + epsilon(- (y - snot.bg_size / 2) / r * 90) + 'deg) rotateY(180deg)';
  }

  var mouseMove = function(event) {

    event.preventDefault();
    event.stopPropagation();

    var x = Math.floor(event.clientX >= 0 ? event.clientX : event.touches[0].pageX);
    var y = Math.floor(event.clientY >= 0 ? event.clientY : event.touches[0].pageY);
    x -= dom_offset_left;
    y -= dom_offset_top;

    touches.click = false;

    if (!touches.onTouching) {
      return false;
    }

    if (event.touches && event.touches.length > 1) {

      var cfx = x;                          // Current frist  finger x
      var cfy = y;                          // Current first  finger y
      var csx = event.touches[1].pageX;     // Current second finger x
      var csy = event.touches[1].pageY;     // Current second finger y

      var dis = distance2D(touches.fx, touches.fy, touches.sx, touches.sy) - distance2D(cfx, cfy, csx, csy);

      var ratio = 0.12;
      snot.setFov(snot.fov + dis * ratio);

      touches.fx = cfx;
      touches.fy = cfy;
      touches.sx = csx;
      touches.sy = csy;

      return false;
    }

    var ratio = snot.mouse_sensitivity;

    dist_ry = dist_ry + (touches.fx - x) * ratio;
    dist_rx = dist_rx - (touches.fy - y) * ratio;

    touches.fx = x;
    touches.fy = y;

    dist_rx = dist_rx > 90 ? 90 : dist_rx;
    dist_rx = dist_rx < -90 ? -90 : dist_rx;

  };

  var mouseDownX;
  var mouseDownY;
  var mouseDown = function (event) {

    event.preventDefault();
    event.stopPropagation();

    var x = floor(event.clientX >= 0 ? event.clientX : event.touches[0].clientX);
    var y = floor(event.clientY >= 0 ? event.clientY : event.touches[0].clientY);
    x -= dom_offset_left;
    y -= dom_offset_top;

    mouseDownX = x;
    mouseDownY = y;

    touches.fx = x;
    touches.fy = y;
    touches.click = true;

    if (event.touches && event.touches.length > 1) {

      touches.sx = event.touches[1].pageX;
      touches.sy = event.touches[1].pageY;

    }

    touches.onTouching = true;
  }

  var mouseWheel = function (event) {

    event.preventDefault();
    event.stopPropagation();

    var offset = event.deltaY;
    snot.setFov(snot.fov + offset * 0.06);

  }

  function on_click(x, y) {
    var R = 100;
    var fov = snot.fov;
    var bg_size = snot.bg_size;
    var arcFactor = Math.PI / 180;
    var rz = snot.rz * arcFactor;
    var width = snot.width;
    var height = snot.height;

    var ry = (x / width - 0.5) * fov;
    var rx = (y / height-0.5) * fov * height / width;
    var r = cos(fov / 2 * arcFactor) * bg_size;
    var ratiox = (x - width / 2) / width * 2;
    var ratioy = (y - height / 2) / width * 2;
    var P = sin(fov / 2 * arcFactor) * bg_size;

    ry = atan(ratiox * P / r);
    rx = atan(ratioy * P / r);

    ry *= 180 / PI;
    rx *= 180 / PI;

    var xyz2 = util.rotation_to_position(R, rx, 0);

    var rr = distance3D(- tan(ry * arcFactor) * xyz2[2], - xyz2[1], xyz2[2], 0, 0, 0);
    var ratio = R / rr;

    var new_x = - tan(ry * PI / 180) * xyz2[2] * ratio;
    var new_y = - xyz2[1] * ratio;
    var new_z = xyz2[2] * ratio;

    var pos = v_set_from_matrix_position(m_multiply(
      m_make_rotation_axis({x: 0, y: 1, z: 0}, - snot.ry * PI / 180),
      m_make_rotation_axis({x: 0, y: 0, z: 1}, - snot.rz * PI / 180),
      m_make_rotation_axis({x: 1, y: 0, z: 0}, - snot.rx * PI / 180),
      m_set_position({x: new_x, y: new_y, z: new_z})
    ));

    ax = - pos.x;
    ay = pos.y;
    az = pos.z;

    var min_offset = 0.4;
    var min_distance = snot.min_detect_distance;
    var nearest;

    var spriteContainers = document.getElementsByClassName('sprite-container');
    for (var i = 0 ;i < spriteContainers.length; ++i) {
      var self = spriteContainers[i];
      var matrix = util.css_text_to_matrix(self.style.webkitTransform);
      var rate_ = 100 / distance3D(0, 0, 0, snot.bg_size / 2 - matrix[12], matrix[13] - snot.bg_size / 2, - matrix[14]);

      var distance = distance3D(- ax, - ay, az, (snot.bg_size / 2 - matrix[12]) * rate_, rate_ * (matrix[13] - snot.bg_size / 2), rate_ * ( - matrix[14]));
      if (distance < min_distance) {
        min_distance = distance;
        nearest = self.children[0];
      }
    }

    var rotation = util.position_to_rotation(ax, az, ay);
    if (nearest) {
      snot.on_sprite_click(snot.sprites[nearest.parentElement.id], nearest);
    } else {
      snot.on_click(ax, ay, az, rotation[0], rotation[1]);
    }
  }

  var mouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();

    var x = floor(event.clientX >= 0 ? event.clientX : event.changedTouches[0].pageX);
    var y = floor(event.clientY >= 0 ? event.clientY : event.changedTouches[0].pageY);
    x -= dom_offset_left;
    y -= dom_offset_top;

    //Screen coordinate to Sphere 3d coordinate
    if (distance2D(mouseDownX, mouseDownY, x, y) < 5) {
      on_click(x, y);
    }
    touches.onTouching = false;
  }

  function _run() {
    snot._animateId = requestAnimationFrame(_run);
    if (!snot.pause_animation) {
      _update();
    }
  }

  function m_make_rotation_from_quaternion(q) {
    return new THREE.Matrix4().makeRotationFromQuaternion(q);
  }

  var camera_euler = new THREE.Euler();
  var target_quat = new THREE.Quaternion();
  var rotate_90_quat = new THREE.Quaternion(- sqrt( 0.5 ), 0, 0, sqrt( 0.5 ))
  var adjust_screen_quats = {
    0: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0),
    90: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - 90),
    180: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), - 180),
    '-90': new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 90),
  };
  var look_at_euler = new THREE.Euler();

  function update_camera(x, y, z) {

    camera_euler.set(y, x, z, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

    target_quat.setFromEuler(camera_euler); // orient the device

    target_quat.multiply(rotate_90_quat); // camera looks out the back of the device, not the top
                                          // - PI/2 around the x-axis
    target_quat.multiply(adjust_screen_quats[screen_orientation]); // adjust for screen orientation

    var slerp_quat = new THREE.Quaternion();
    THREE.Quaternion.slerp(target_quat, previous_quat, slerp_quat, 1 - snot.smooth);
    previous_quat = slerp_quat;
    var look_at_quat = slerp_quat.clone();
    look_at_quat.x *= -1;
    look_at_quat.z *= -1;
    var look_at_mat = m_make_rotation_from_quaternion(look_at_quat.normalize()).transpose();
    var look_at_rot = look_at_euler.setFromRotationMatrix(look_at_mat, 'XZY');

    snot.rx = look_at_rot._x * 180 / PI;
    snot.ry = look_at_rot._y * 180 / PI;
    snot.rz = look_at_rot._z * 180 / PI;

    snot.camera_look_at = v_set_from_matrix_position(m_multiply(
      m_make_rotation_axis({x: 0, y: 1, z: 0}, look_at_rot._y),
      m_make_rotation_axis({x: 0, y: 0, z: 1}, look_at_rot._z),
      m_make_rotation_axis({x: 1, y: 0, z: 0}, - look_at_rot._x),
      m_set_position({x: 0, y: 0, z: 1})
    )); // bad performance here

    snot.camera.style.transform = 'translateZ(' + epsilon(snot.perspective) + 'px)' + " matrix3d(" + look_at_mat.elements + ")"+ snot.cameraBaseTransform;
  }

  function _update() {
    snot.frames++;

    if (snot.gyro) {
      if (vars.alpha === -1 && vars.beta === -1 && vars.gamma === - 1) {
        return;
      }

      update_camera(vars.alpha, vars.beta, - vars.gamma);
    } else {
      if (prev_gyro) {
        dist_rx = 0;
        dist_ry = 0;
      }
      dist_ry += snot.auto_rotation;
      update_camera( - dist_ry * PI / 180, dist_rx * PI / 180 + PI / 2, 0);
    }
    prev_gyro = snot.gyro;

    for (var i in snot.sprites) {
      var sprite = snot.sprites[i];
      if (sprite.need_update_position) {
        sprite.need_update_position = false;
        update_sprite_position(sprite.id);
      }
      if (sprite.need_update_visibility) {
        sprite.need_update_visibility = false;
        update_sprite_visibility(sprite.id);
      }
    }
  }

  window.addEventListener('orientationchange', function(ev) {
    screen_orientation = window.orientation || 0;
  }, false );

  window.addEventListener('deviceorientation', function(ev) {
    if (ev.alpha !== null) {
      vars.beta = ev.beta  * Math.PI / 180 ;
      vars.gamma = ev.gamma  * Math.PI / 180;
      vars.alpha = ev.alpha  * Math.PI / 180;
    } else {
      vars.beta = vars.gamma = vars.alpha = -1;
    }
  }, true);


  var _setRx = function(rx, smooth) {
    //TODO
  }

  var _setRy=function(ry,smooth){
    //TODO
  }

  function merge_json(obj, json) {
    for (var i in json) {
      if (obj[i] == undefined) {
        obj[i] = json[i];
      }
    }
  }

  merge_json(snot, {
    setFov: set_fov,
    setRx: _setRx,
    setRy: _setRy,
    init: _init,
    run: _run,
    update: _update,
    load_sprites: _load_sprites,
  });
}(window);
