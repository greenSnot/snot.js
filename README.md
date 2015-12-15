# Snot-pano
The simplest HTML5 panorama viewer

##Summary
To create a textured cube for panorama viewing by CSS 3D trasformation.

#Useage
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
        fov:90,
        maxFov:110,
        minFov:60,
        smooth:0,
        movingRatio:0.3,
        autoRotation:0.1,
        rx:0,
        ry:0
    });
</script>
```

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
***
#Snot-pano
简易的HTML5全景展示工具

##简介
使用css变换构造的一个6面正方体,分别贴上纹理实现全景效果


