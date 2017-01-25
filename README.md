# Snot-pano
HTML5/Webgl panorama viewer

# Examples
[Street view(css renderer)](http://greensnot.github.io/snot.js/examples/streetview.html)

[Street view(webgl renderer)](http://greensnot.github.io/snot.js/examples/streetview_webgl_renderer.html)

[Shooting game(css renderer)](http://greensnot.github.io/snot.js/examples/shooting.html)

[Shooting game(webgl renderer)](http://greensnot.github.io/snot.js/examples/shooting_webgl_renderer.html)

[Painter(gyro sensor required)](http://greensnot.github.io/snot.js/examples/painter.html)

[Music wall](http://mclassical.org)

#Usage
###CSS Render
####./examples/streetview.html
```
<head>
  <link rel="stylesheet" type="text/css" href="build/css/snot.min.css">
</head>
<div id="snot-wrap">
  <div id="snot-container">
    <div id="snot-camera">
      <img class="snot-bg front">
      <img class="snot-bg left">
      <img class="snot-bg right">
      <img class="snot-bg back">
      <img class="snot-bg top">
      <img class="snot-bg bottom">
    </div>
  </div>
</div>
<script src="build/js/snot_css_renderer.min.js"></script>
<script>
  snot.init({
    size: 1248, // usually it is the width of the background image
    quality: 0.9, // between 0 to 1, higher quality needs more computation
    bg_imgs:[
      'http://front.jpg',
      'http://down.jpg',
      'http://left.jpg',
      'http://back.jpg',
      'http://top.jpg',
      'http://right.jpg'
    ],
    bg_rotation: [0, 0, 0, 0, 0, 0],
    fov: 90,
    max_fov: 110,
    min_fov: 60,
    smooth: 0.17,
    mouse_sensitivity: 0.3,
    auto_rotation: 0.0,
    rx: 0, // rotation of x axis (degree)
    ry: 0, // rotation of y axis (degree)
  });
  snot.run();
</script>
```
###Custom Sprites
```
  <script>
    // ...
    // after snot.init
    function spot_generator() {
      return '' +
        '<div class="spot-' + this.spotType + '">' +
          '<div class="spot-description">' + this.text + '</div>' +
          '<img class="spot-image" src="images/' + this.spotType + '.png"/>' +
        '</div>';
    }
    snot.add_sprites([{
      //Essentials
      mesh_generator: spot_generator,
      id: 'spot-'+123,
      x: 100,
      y: 200,
      z: 100,

      //Optionals (Custom properties)
      spotType: 'left',
      text: 'haha'
    }]);
  </script>
```
###Webgl Render
####./examples/streetview_webgl_renderer.html
```
<div id="snot-wrap">
  <div id="snot-container">
  </div>
</div>
<script src="build/js/snot_webgl_renderer.min.js"></script>
```
####Custom Sprites
####./examples/shooting_webgl_renderer.html

##Interaction
```
function on_click(point, rotation) {
}

function sprite_on_click(data) {
  console.log(data);
}

snot.init({
  //...
  on_click: on_click, // when you are clicking the backgrounds
  sprite_on_click: sprite_on_click
});
```

##Compatibility

###Support:
* Safari
* Safari Mobile
* Chrome
* Chrome Mobile

###Unsupport:
* IE
* Firefox

###Unstable:
* Android-QQbrowser-x5(微信浏览器）
* Android-original-browser(webkit) 

###Options
```
{
  container: document.getElementById('snot-container'),
  dom: document.getElementById('snot-wrap'),
  quality: 1, // between 0 to 1, higher quality needs more computation
  mouse_sensitivity: 0.3, // ratio of moving n pixels to change m degrees rotationX
  auto_rotation: 0, //anticlockwise auto rotate * degrees per frame
  frames: 0, // counter
  bg_rotation: [0, 0, 0, 0, 0, 0], // front, down, left, back, top, right

  pause_animation: false,

  size: 1024,
  clicks_depth: 1024 / 2.5,

  gyro: false,
  ry: 0,        // Rotate * degrees around y axis
  rx: 0,        // Rotate * degrees around x axis
  dest_rx: 0,   // Destination of rotationX
  dest_ry: 0,   // Destination of rotationY
  dest_rz: 0,   // Destination of rotationY

  max_fov: 120,
  min_fov: 60,
  fov: 90,
  smooth: 0.83, // between 0 to 1, from rigid to smooth
  min_detect_distance: 20, // click nearest sprite
  on_click: function() {}, // background on click
  sprite_on_click: function() {},
}

```
###API
set_fov(fov:number);
set_rx(rx:number);
set_ry(ry:number);
add_sprites(sprites);
remove_sprite(sprite_id);
update(); // update manually, see examples/shooting_webgl_renderer.html
run(); // start main loop, it will call snot.update automatically.
screenshot(); //return base64_imgs_arr[front, down, left, back, top, right], webgl_renderer only.
