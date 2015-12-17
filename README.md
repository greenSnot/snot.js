# Snot-pano
The simplest HTML5/Webgl panorama viewer

##Summary
To create a textured cube for panorama viewing by CSS 3D trasformation/Webgl.

#Useage
###CSS Render
####./index_css_render.html
```
<div id="snot-pano">
    <div id="container">
        <div id="camera">
            <img class="cube front"></img>
            <img class="cube left"></img>
            <img class="cube right"></img>
            <img class="cube back"></img>
            <img class="cube top"></img>
            <img class="cube bottom"></img>
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
        imgs_compressed:[
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
        fov:90,             // Field Of View (angle)
        maxFov:110,         // max Field Of View (angle)
        minFov:60,          // min Field Of View (angle)
        smooth:0.8,         // 0-1 float
        movingRatio:0.3,
        autoRotation:0.1,
        rx:0,
        ry:0
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
        <div id="camera">
            <img class="cube front"></img>
            <img class="cube left"></img>
            <img class="cube right"></img>
            <img class="cube back"></img>
            <img class="cube top"></img>
            <img class="cube bottom"></img>
        </div>
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
        imgs_compressed:[
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

##Auto Detection (CSS/Webgl)
####./index.html

##Compatibility
###Support:
* Safari
* Chrome

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

#Snot-pano
简易的HTML5全景展示工具

##简介
使用css变换/webgl构造的一个6面正方体,分别贴上纹理实现全景效果
