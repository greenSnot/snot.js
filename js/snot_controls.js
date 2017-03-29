var THREE = require('three');
var util = require('./snot_util.js');
var distance2D = util.distance2D;
var floor = Math.floor;
var cos = Math.cos;
var sin = Math.sin;
var atan = Math.atan;
var tan = Math.tan;
var PI = Math.PI;

var m_make_rotation_axis = util.m_make_rotation_axis;
var m_multiply = util.m_multiply;
var m_set_position = util.m_set_position;
var m_make_rotation_from_quaternion = util.m_make_rotation_from_quaternion;
var v_set_from_matrix_position = util.v_set_from_matrix_position;

function raycaster_compute(host, x, y) {
  var mouse = new THREE.Vector2();
  mouse.set((x / host.width) * 2 - 1, - (y / host.height) * 2 + 1);
  host.raycaster.setFromCamera(mouse, host.camera);
  var intersects = host.raycaster.intersectObjects(host.suspects_for_raycaster);
  var point = util.standardlization(intersects[0].point, host.clicks_depth);
  return {
    point: point,
    intersects: intersects
  };
}

export class Controls {

  constructor(host, _on_click) {
    this.host = host;
    this.allow_zooming_by_multi_fingers = true;
    this.on_click = _on_click || function() {};

    this.dom_offset_left = util.left_pos(this.host.dom);
    this.dom_offset_top = util.top_pos(this.host.dom);

    this.screen_orientation = window.orientation || 0;
    this.gyro_data =  {
      alpha: 0,
      beta: 90 * PI / 180,
      gamma: 0
    };

    this.touches = {
      fx: 0,   // First  finger x
      fy: 0,   // First  finger y
      sx: 0,   // Second finger x
      sy: 0    // Second finger y
    };

  }

  start_listeners(opts) {
    for (var i in opts.events) {
      if (i === 'orientationchange' || i === 'deviceorientation') {
        window.addEventListener(i, opts.events[i], false);
      } else {
        this.host.container.addEventListener(i, opts.events[i], false);
      }
    }
  }

  stop_listeners(opts) {
    for (var i in opts) {
      if (i === 'orientationchange' || i === 'deviceorientation') {
        window.removeEventListener(i, opts.events[i], false);
      } else {
        this.host.container.removeEventListener(i, opts.events[i], false);
      }
    }
  }

  mouse_down_handler(event) {
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    var x = floor(event.clientX >= 0 ? event.clientX : event.touches[event.touches.length - 1].clientX);
    var y = floor(event.clientY >= 0 ? event.clientY : event.touches[event.touches.length - 1].clientY);
    x -= this.dom_offset_left;
    y -= this.dom_offset_top;

    this.touches.mouse_down_x = x;
    this.touches.mouse_down_y = y;
    this.touches.fx = x;
    this.touches.fy = y;
    this.touches.click = true;

    if (event.touches && event.touches.length > 1) {

      this.touches.sx = event.touches[1].pageX;
      this.touches.sy = event.touches[1].pageY;

    }

    this.touches.is_touching = true;
    if (this.host.on_touch_start) {
      if (this.host.raycaster_on_touch_start) {
        var res = raycaster_compute(this.host, x, y);
        this.host.on_touch_start(event, x, y, res.point, res.intersects);
      } else {
        this.host.on_touch_start(event, x, y);
      }
    }
  }

  mouse_wheel_handler(event) {
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    var offset = event.deltaY;
    this.host.set_fov(this.host.fov + offset * 0.06);
  }

  mouse_up_handler(event) {
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    var x = floor(event.clientX >= 0 ? event.clientX : event.changedTouches[event.changedTouches.length - 1].pageX);
    var y = floor(event.clientY >= 0 ? event.clientY : event.changedTouches[event.changedTouches.length - 1].pageY);
    x -= this.dom_offset_left;
    y -= this.dom_offset_top;

    //Screen coordinate to Sphere 3d coordinate
    if (distance2D(this.touches.mouse_down_x, this.touches.mouse_down_y, x, y) < 5) {
      this.on_click.bind(this.host)(x, y);
    }
    if (this.host.on_touch_end) {
      this.host.on_touch_end(event);
    }
    this.touches.is_touching = false;
  }

  mouse_move_handler(event) {
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();

    var x = Math.floor(event.clientX >= 0 ? event.clientX : event.touches[event.touches.length - 1].pageX);
    var y = Math.floor(event.clientY >= 0 ? event.clientY : event.touches[event.touches.length - 1].pageY);
    x -= this.dom_offset_left;
    y -= this.dom_offset_top;

    this.touches.click = false;

    if (!this.touches.is_touching) {
      return false;
    }

    if (event.touches && event.touches.length > 1) {
      if (this.allow_zooming_by_multi_fingers ) {

        var cfx = x;                          // Current frist  finger x
        var cfy = y;                          // Current first  finger y
        var csx = event.touches[1].pageX;     // Current second finger x
        var csy = event.touches[1].pageY;     // Current second finger y

        var dis = distance2D(this.touches.fx, this.touches.fy, this.touches.sx, this.touches.sy) - distance2D(cfx, cfy, csx, csy);

        var ratio = 0.12;
        this.host.set_fov(this.host.fov + dis * ratio);

        this.touches.fx = cfx;
        this.touches.fy = cfy;
        this.touches.sx = csx;
        this.touches.sy = csy;

        return false;
      }
    }

    if (this.host.on_touch_move) {
      if (this.host.raycaster_on_touch_move) {
        var res = raycaster_compute(this.host, x, y);
        this.host.on_touch_move(event, x, y, res.point, res.intersects);
        return;
      } else {
        this.host.on_touch_move(event, x, y);
      }
    }

    this.host.dest_ry = this.host.dest_ry + (this.touches.fx - x) * this.host.mouse_sensitivity;
    this.host.dest_rx = this.host.dest_rx - (this.touches.fy - y) * this.host.mouse_sensitivity;

    this.touches.fx = x;
    this.touches.fy = y;

    this.host.dest_rx = this.host.dest_rx > 90 ? 90 : this.host.dest_rx;
    this.host.dest_rx = this.host.dest_rx < -90 ? -90 : this.host.dest_rx;

  }

  orientation_on_change_handler(ev) {
    this.screen_orientation = window.orientation || 0;
  }

  gyro_data_on_change_handler(ev) {
    if (ev.alpha !== null) {
      this.gyro_data.beta = ev.beta  * Math.PI / 180 ;
      this.gyro_data.gamma = ev.gamma  * Math.PI / 180;
      this.gyro_data.alpha = ev.alpha  * Math.PI / 180;
    } else {
      this.gyro_data.beta = this.gyro_data.gamma = this.gyro_data.alpha = -1;
    }
  }
}
