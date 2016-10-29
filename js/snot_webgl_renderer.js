!function(global) {

  var snot={

    camera_look_at: {
      x: 0,
      y: 0,
      z: 1,
    },
    moving_ratio: 0.3,
    auto_rotation: 0,
    frames:0,
    bg_rotation: [0,0,0,0,0,0],

    pause_animation: false,
    generator: {
      text: text_generator,
    },

    dom      : document.getElementById('snot-wrap'),
    camera   : document.getElementById('snot-camera'),
    container: document.getElementById('snot-container'),

    bg_size: 1024,

    gyro: false,

    smooth: 1 - 0.17,
    quaternion: {},

    rz: 0,
    ry : 0,       // Rotate * degree around y axis
    rx : 0,       // Rotate * degree around x axis
    max_fov : 120, // Max field of view (degree)
    min_fov : 60,  // Min field of view (degree)
    fov : 90,     // Default field of view
  };

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

  var camera;
  var scene;
  var renderer;
  var bg_materials = [];
  var suspects = [];
  var sprites = {};
  var dist_ry;
  var dist_rx;
  var _overdraw = 1;
  THREE.ImageUtils.crossOrigin = '*';

  var mouse_down_x;
  var mouse_down_rx;
  var mouse_down_ry;
  var mouse_down_y;
  var is_mouse_down = false;

  function _pointStandardlization(x, y, z) {
    var ratio=200/distance3D(x, y, z, 0, 0, 0);
    return [x * ratio, y * ratio, z * ratio];
  }
  //0     1    2    3    4   5
  //front down left back top right
  //front down left back top right
  var img_index_convert = [3, 0, 4, 1, 5, 2];
  function load_bg_imgs(imgs) {
    var size = snot.bg_size;
    var precision = 1;
    var geometry = new THREE.BoxGeometry(size, size, size, precision, precision, precision);
    for (var index = 0;index < 6; ++index) {
      var img_url = imgs[img_index_convert[index]];
      bg_materials.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(img_url, THREE.UVMapping),
        overdraw: _overdraw
      }));
    }
    var material= new THREE.MeshFaceMaterial(bg_materials);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.scale.x = - 1;

    scene.add(mesh);
  }

  function text_generator(x, y, z, text, size, rotation_x, color) {
    var rate = 20;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var ch = parseInt(canvas.height);
    var cw = parseInt(canvas.width);
    function drawCanvas(text, size) {
      context = canvas.getContext('2d');
      context.font = size + 'px STHeiti';
      if (!color) {
        context.shadowOffsetX = 5;
        context.shadowOffsetY = 5;
        context.shadowBlur = 20;
        context.shadowColor = 'rgba(0,0,0,1)';
        context.fillStyle = '#fff';
      } else {
        context.fillStyle = color;
      }
      context.textAlign = 'center';
      context.textBaseline = 'middle';
    }
    drawCanvas(text, size);
    canvas.width = parseInt(context.measureText(text).width + 10);
    ch = parseInt(canvas.height);
    cw = parseInt(canvas.width);
    drawCanvas(text, size);
    context.fillText(text, cw / 2, ch / 2);

    var geom = new THREE.PlaneGeometry(cw / rate, ch / rate, 1, 1);
    var cTexture = new THREE.Texture(canvas);
    var mat = new THREE.MeshBasicMaterial({map:cTexture, transparent:true, overdraw:_overdraw});
    cTexture.needsUpdate = true;
    var mesh = new THREE.Mesh(geom, mat);

    mesh.position.set(x, y, z);

    if (rotation_x) {
      rotation_x = rotation_x * Math.PI / 180;
      mesh.rotation.x = rotation_x;
    } else {
      var rotation = util.position_to_rotation(x, z, y);
      rotation.ry = 270 - rotation.ry;
      rotation.ry = rotation.ry < 0 ? rotation.ry + 360 : rotation.ry;
      mesh.rotation.y = rotation.ry * Math.PI / 180;
    }

    return mesh;
  }
  function init(config) {
    for (var i in config) {
      if (i == 'generator') {
        for (var j in config.generator) {
          snot.generator[j] = config.generator[j];
        }
        continue;
      }
      snot[i] = config[i];
    }
    var smooth = snot.smooth;
    snot.smooth = 0;
    for (var i in sprites) {
      scene.remove(scene.getObjectByName(i));
    }
    sprites = {};
    var rx = snot.rx;
    var ry = snot.ry;

    var container = snot.container;
    camera = new THREE.PerspectiveCamera(snot.fov, window.innerWidth / window.innerHeight, 1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);
    snot.camera = camera;

    scene = new THREE.Scene();

    snot.scene = scene;

    if (config.callback) {
      config.callback();
    }
    load_bg_imgs(config.bg_imgs);

    var SphereGeometry = new THREE.SphereGeometry(snot.bg_size * 1.8, 32, 32);
    var SphereMaterial = new THREE.MeshBasicMaterial({color: 0xff00ff, side: THREE.DoubleSide});
    var SphereMesh = new THREE.Mesh(SphereGeometry, SphereMaterial);
    scene.add(SphereMesh);
    suspects.push(SphereMesh);

    load_sprites(config.sprites);

    renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    container.addEventListener('touchstart', onDocumentMouseDown, false);
    container.addEventListener('touchmove', onDocumentMouseMove, false);
    container.addEventListener('touchend', onDocumentMouseUp, false);

    container.addEventListener('mousedown', onDocumentMouseDown, false);
    container.addEventListener('mousemove', onDocumentMouseMove, false);
    container.addEventListener('mouseup', onDocumentMouseUp, false);
    container.addEventListener('mousewheel', onDocumentMouseWheel, false);
    //container.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);

    update();
    snot.smooth = smooth;
  }

  function onDocumentMouseDown(event) {

    event.preventDefault();

    is_mouse_down = true;
    var x = parseInt(event.clientX >= 0 ? event.clientX : event.changedTouches[0].clientX);
    var y = parseInt(event.clientY >= 0 ? event.clientY : event.changedTouches[0].clientY);
    mouse_down_x = x;
    mouse_down_y = y;
    mouse_down_ry = snot.ry;
    mouse_down_rx = snot.rx;

  }


  function onDocumentMouseMove( event ) {

    if (!is_mouse_down) {
      return;
    }

    var x = parseInt(event.clientX >= 0 ? event.clientX : event.touches[0].pageX);
    var y = parseInt(event.clientY >= 0 ? event.clientY : event.touches[0].pageY);

    if (event.touches && event.touches.length > 1) {
      return;
    }

    dist_ry = (mouse_down_x - x) * snot.moving_ratio + mouse_down_ry;
    dist_rx = (y - mouse_down_y) * snot.moving_ratio + mouse_down_rx;
    dist_rx = dist_rx >= 90 ? 89 : dist_rx;
    dist_rx = dist_rx <= - 90 ? -89 : dist_rx;

    snot.rx = dist_rx;
    snot.ry = dist_ry;
  }

  function onDocumentMouseUp(event) {
    is_mouse_down = false;
    var x = parseInt(event.clientX >= 0 ? event.clientX : event.changedTouches[0].pageX);
    var y = parseInt(event.clientY >= 0 ? event.clientY : event.changedTouches[0].pageY);

    if (util.distance2D(x, y, mouse_down_x, mouse_down_y) < 5) {//单击
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      mouse.set((x / window.innerWidth) * 2 - 1, - (y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      raycaster.far = snot.bg_size * 2;
      var intersects = raycaster.intersectObjects(suspects);
      if (intersects.length != 0) {
        var point = intersects[0].point;
        if (intersects[0].object.data) {
          snot.onSpriteClick(intersects[0].object.data);
        } else {
          var standard = _pointStandardlization(point.x, point.y, point.z);
          var rotation = util.position_to_rotation(point.x, point.y, point.z);
          snot.on_click(standard[0], standard[1], standard[2], rotation.rx, rotation.ry);
        }
      }
    }
  }

  function onDocumentMouseWheel(event) {

    // WebKit

    if (event.wheelDeltaY) {

      snot.fov -= event.wheelDeltaY * 0.05;

      // Opera / Explorer 9

    } else if (event.wheelDelta) {

      snot.fov -= event.wheelDelta * 0.05;

      // Firefox

    } else if (event.detail) {

      snot.fov += event.detail * 1.0;

    }
    snot.fov = snot.fov > snot.max_fov ? snot.max_fov : snot.fov;
    snot.fov = snot.fov < snot.min_fov ? snot.min_fov : snot.fov;

  }

  function update() {

    snot.ry += snot.auto_rotation;

    var rx = snot.rx;
    var ry = snot.ry;
    var rz = snot.rz * Math.PI / 180;

    ry = THREE.Math.degToRad(ry + 180);
    rx = THREE.Math.degToRad(rx - 90);

    camera.autoUpdateMatrix = false;

    var q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, - 1, 0), ry);
    rx += Math.PI / 2;
    q = new THREE.Quaternion().multiplyQuaternions(q, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rx));
    q = new THREE.Quaternion().multiplyQuaternions(q, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rz));

    var newQuaternion = new THREE.Quaternion();
    THREE.Quaternion.slerp(camera.quaternion, q, newQuaternion, 1 - snot.smooth);
    camera.quaternion.copy(newQuaternion);
    camera.quaternion.normalize();

    camera.fov = snot.fov;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function set_fov(fov) {
    snot.fov = fov;
    snot.fov = snot.fov > snot.max_fov ? snot.max_fov : snot.fov;
    snot.fov = snot.fov < snot.min_fov ? snot.min_fov : snot.fov;
  }
  function set_rx(rx) {
    dist_rx = rx;
  }
  function set_ry(ry) {
    dist_ry = ry;
  }
  function load_sprites(sps) {
    for (var i in sps) {
      var functionName = sps[i].spriteType;
      var mesh = snot.generator[functionName](sps[i]);

      mesh.data = sps[i];
      sprites[mesh.name] = true;
      suspects.push(mesh);
      scene.add(mesh);

    }
  }
  function run() {
    snot._animateId = requestAnimationFrame(run);
    if (!snot.pause_animation) {
      update();
    }
  }

  function extend(obj, json) {
    for (var i in json) {
      obj[i] = json[i];
    }
  }
  extend(global.snot,{
    set_fov: set_fov,
    set_rx: set_rx,
    set_ry: set_ry,
    init: init,
    run: run,
    load_sprites: load_sprites
  });
}(window);
