# Snot-pano
HTML5/Webgl panorama viewer

# Examples
[Street view](http://greensnot.github.io/snot.js/)
[Shooting game](http://greensnot.github.io/snot.js/shooting.html)
[Music wall](http://mclassical.org)

#Usage
###CSS Render
####./index.html
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
  <script id="template-spot" type="text/html">
    <div class="spot-<#=spotType#>">
      <div class="spot-description"><#=text#></div>
      <img class="spot-image" src="images/<#=spotType#>.png"/>
    </div>
  </script>
  <script>
    // ...
    // after snot.init
    snot.generator.spot = template('template-spot');
    snot.load_sprites([{
      //Essentials
      generator: 'spot',
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
####./index_webgl_renderer.html
```
<div id="snot-wrap">
  <div id="snot-container">
  </div>
</div>
<script src="build/js/snot_webgl_renderer.min.js"></script>
```
####Custom Sprites
####./index_webgl_renderer.html

##Interaction
```
function on_click(x, y, z, rx, ry) {
}

function onSpriteClick(data) {
  console.log(data);
}
sti.init({
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

{
  debug: false, // show rotation infomation
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

  generator: {},
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
