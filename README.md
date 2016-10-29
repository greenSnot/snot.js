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
<div id="snot-pano">
  <div id="container">
    <div id="camera">
      <img class="cube front">
      <img class="cube left">
      <img class="cube right">
      <img class="cube back">
      <img class="cube top">
      <img class="cube bottom">
    </div>
  </div>
</div>
<script src="build/js/snot_css_renderer.min.js"></script>
<script>
  snot.init({
    bg_size:1248, // usually it is the width of background image
    bg_imgs:[
      'http://front.jpg',
      'http://down.jpg',
      'http://left.jpg',
      'http://back.jpg',
      'http://top.jpg',
      'http://right.jpg'
    ],
    bg_rotation: [0,0,0,0,0,0],
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
function onClick(x, y, z, rx, ry) {
}

function onSpriteClick(data){
  console.log(data);
}
sti.init({
  //...
  on_click: on_click, // when you clicking the empty space from backgrounds
  on_sprite_click: on_sprite_click
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

#To do list:
* Compatibility
