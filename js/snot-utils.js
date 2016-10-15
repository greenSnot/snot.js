function leftPos(elem) {
    var curleft = 0;
    if (elem.offsetParent) {
        do { 
            curleft +=elem.offsetLeft; 
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

function position2rotation(x,y,z){
    var r=distance3D(x,y,z,0,0,0);
    var rx=Math.asin(z/r);
    var ry=Math.asin(y/r/Math.cos(rx));
    if(x<0){
        ry=ry>0?Math.PI-ry:-Math.PI-ry;
    }

    return {rx:-rx*180/Math.PI,ry:(ry<0?ry+Math.PI*2:ry)*180/Math.PI}

}
function topPos(elem) {
    var curtop = 0;
    if (elem.offsetParent) {
        do { 
            curtop +=elem.offsetTop; 
        } while (elem = elem.offsetParent);
    }
    return curtop;
};
var distance2D = function(a,b,c,d){

    return Math.pow((a-c)*(a-c)+(b-d)*(b-d),0.5);

}

var distance3D = function(a,b,c,d,e,f){

    return Math.pow((a-d)*(a-d)+(b-e)*(b-e)+(c-f)*(c-f),0.5);

}

var epsilon = function ( value ) {

    return Math.abs( value ) < 0.000001 ? 0 : value.toFixed(5);

};

var text2Matrix=function(t){
    var m=new WebKitCSSMatrix(t);
    return [
        epsilon(m.m11),epsilon( m.m12),epsilon(m.m13),epsilon(m.m14),
        epsilon(m.m21),epsilon( m.m22),epsilon(m.m23),epsilon(m.m24),
        epsilon(m.m31),epsilon( m.m32),epsilon(m.m33),epsilon(m.m34),
        epsilon(m.m41),epsilon( m.m42),epsilon(m.m43),epsilon(m.m44)
            ];
}

function matrix2Text(a,b,c,d ,e,f,g,h, i,j,k,l, m,n,o,p){
    if(typeof(a)=='object'){
        return 'matrix3d('+(a.join(','))+')';
    }
    return 'matrix3d('+a+','+b+','+c+','+d+','+e+','+f+','+g+','+h+','+i+','+j+','+k+','+l+','+m+','+n+','+o+','+p+')';
}
function isAndroid(){
    var u=navigator.userAgent;
    return u.indexOf('Android')>=0?1:0;
}
function isIphone(){
    var u=navigator.userAgent;
    return u.indexOf('iPhone')>=0?1:0;
}
function isIpad(){
    var u=navigator.userAgent;
    return u.indexOf('iPad')>=0?1:0;
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


function webgl_detect(return_context)
{
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
            names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
                  context = false;

        for(var i=0;i<4;i++) {
            try {
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter == "function") {
                    // WebGL is enabled
                    if (return_context) {
                        // return WebGL object if the function's argument is present
                        return {name:names[i], gl:context};
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
function include_js(file,callback) {
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
function rotation2Position(z,rx,ry,rz){
    z=-z;
    rx=-rx;

    var x=snot.bg_size / 2;
    var y=snot.bg_size / 2;

    var transform = text2Matrix( 'translate3d('+x+'px,'+y+'px,0) rotateY('+(0)+'deg) rotateX('+(0)+'deg) rotateY('+(ry?-ry:0)+'deg) rotateX('+(rx?-rx:0)+'deg) rotateZ('+(rz?rz:0)+'deg) translateZ('+z+'px)' );
    return [-transform[12]+snot.bg_size/2,transform[13]-snot.bg_size/2,-transform[14]];

}

