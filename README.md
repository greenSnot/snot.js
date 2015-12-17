# Snot-pano
The simplest HTML5/Webgl panorama viewer

##Summary
To create a textured cube for panorama viewing by CSS 3D trasformation/Webgl.

#Usage
###CSS Render
####./index_css_render.html
```
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
<script src="js/zepto.min.js"></script>
<script src="js/tween.min.js"></script>
<script src="js/snot-utils.js"></script>
<script src="js/snot-pano-css.js"></script>
<script>
    snot.init({
        cubeSize:1248,
        imgs_preview:[
            'http://front.jpg',
            'http://down.jpg',
            'http://left.jpg',
            'http://back.jpg',
            'http://top.jpg',
            'http://right.jpg'
        ],
        imgs_original:[
            'http://front.jpg',
            'http://down.jpg',
            'http://left.jpg',
            'http://back.jpg',
            'http://top.jpg',
            'http://right.jpg'
        ],
        imgs_rotation:[0,0,0,0,0,0],
        fov:90,             // Field Of View (euler angle)
        maxFov:110,         // max Field Of View (euler angle)
        minFov:60,          // min Field Of View (euler angle)
        smooth:0.8,         // 0-1 float 
        movingRatio:0.3,
        autoRotation:0.1,
        rx:0,               // Rotation around x axis (euler angle)
        ry:0                // Rotation around y axis (euler angle)
    });
</script>
```
###Custom Sprites
```
    //Only For CSS Renderer
    <script id="template-spot" type="text/html">
        <div data-type="sprite" class="<#=spriteType+'-'+spotType#>" id="<#=id#>" >
            <div class="spot-description"><#=text#></div>
            <div class="spot-image-wrap">
                <div class="spot-image"></div>
            </div>
        </div>
    </script>
    <script src="js/template-native.js"></script>
    <script>
        template.config('openTag','<#');
        template.config('closeTag','#>');
    </script>
    <script>
        snot.loadSprites([{
                //Only For CSS Renderer
                //TemplateId for template renderer
                template:'template-spot',

                //Essentials
                spriteType:'spot',
                id:'spot-'+123,
                x:100,
                y:200,
                z:100,

                //Optionals (Custom properties)
                spotType:'left',
                text:'haha'
        }]);
    </script>
```
###Webgl Render
####./index_webgl_renderer.html
```
<div id="snot-pano">
    <div id="container">
    </div>
</div>
<script src="js/zepto.min.js"></script>
<script src="js/tween.min.js"></script>
<script src="js/snot-utils.js"></script>
<script src="js/three.min.js"></script>
<script src="js/three.patch.js"></script>
<script src="js/Projector.js"></script>
<script src="js/snot-pano-webgl.js"></script>
<script>
    snot.init({
        cubeSize:1248,
        imgs_preview:[
            'http://front.jpg',
            'http://down.jpg',
            'http://left.jpg',
            'http://back.jpg',
            'http://top.jpg',
            'http://right.jpg'
        ],
        imgs_original:[
            'http://front.jpg',
            'http://down.jpg',
            'http://left.jpg',
            'http://back.jpg',
            'http://top.jpg',
            'http://right.jpg'
        ],
        imgs_rotation:[0,0,0,0,0,0],
        fov:90,
        maxFov:110,
        minFov:60,
        smooth:0.8,
        movingRatio:0.3,
        autoRotation:0.1,
        rx:0,
        ry:0
    });
</script>
```
####Custom Sprites
####./index_webgl_renderer.html

##Interaction
```
function onClick(x,y,z,rx,ry){
    console.log(x,y,z,rx,ry);
}
function onSpriteClick(data){
    //data is the JSON what you define in sprites like following.
    console.log(data);
    /*Output:{
          template:'template-spot',

          spriteType:'spot',
          id:'spot-'+123,
          x:100,
          y:200,
          z:100,

          spotType:'left',
          text:'haha'
    }*/
}
sti.init({
    //...
    onClick:onClick,
    onSpriteClick:onSpriteClick
});
```

##Auto Detection (CSS/Webgl)
####./index.html

##Compatibility

###Known
* iOS < 8 unsupport Webgl but all the iOS devices work well in both CSS/Webgl.
* Almost all of Android phones support webgl but unstable.
* Many Android phones is very unstable when using CSS transform.
* Few Android phones unsupport VR mode.

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

#Demo
* mclassical.org/mclassical.com

#To do list:
* Compatibility
* Callback when imgs loaded
* VR mode

#Snot-pano
简易的HTML5全景展示工具

##简介
使用css变换/webgl构造的一个6面正方体,分别贴上纹理实现全景效果
