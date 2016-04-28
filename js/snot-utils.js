function quaternion2euler(w,x,y,z){
    var a=Math.atan2(2*(w*x+y*z),1-2*(x*x+y*y));
    var b=Math.asin(2*(w*y-z*x));
    var c=Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z));
    return [a,b,c]
}
function getQuaternion( alpha, beta, gamma ) {

    var degtorad=Math.PI/180;
  var _x = beta  ? beta  * degtorad : 0; // beta value
  var _y = gamma ? gamma * degtorad : 0; // gamma value
  var _z = alpha ? alpha * degtorad : 0; // alpha value

  var cX = Math.cos( _x/2 );
  var cY = Math.cos( _y/2 );
  var cZ = Math.cos( _z/2 );
  var sX = Math.sin( _x/2 );
  var sY = Math.sin( _y/2 );
  var sZ = Math.sin( _z/2 );

  //
  // ZXY quaternion construction.
  //

  var w = cX * cY * cZ - sX * sY * sZ;
  var x = sX * cY * cZ - cX * sY * sZ;
  var y = cX * sY * cZ + sX * cY * sZ;
  var z = cX * cY * sZ + sX * sY * cZ;

  return [ w, x, y, z ];

}
var unbindOrientation=function(){
	window.removeEventListener( 'orientationchange');
	window.removeEventListener( 'deviceorientation');
}
var bindOrientation=function(callback){
    var scope=this;
    window.addEventListener('orientationchange',function(){
        scope.screenOrientation=window.orientation||0;
    },false);
    window.addEventListener('deviceorientation', function(){ 
        /*
        var beta=event.beta?event.beta*Math.PI/180:0;
        var gamma=event.gamma?event.gamma*Math.PI/180:0;
        var alpha=event.alpha?event.alpha*Math.PI/180:0;
        var orient=scope.screenOrientation?scope.screenOrientation*Math.PI/180:0;

        var euler= new THREE.Euler();
        euler.set(beta,alpha,-gamma,'YXZ');
        var q=new THREE.Quaternion().setFromEuler(euler);
        q.multiply(new THREE.Quaternion(-Math.sqrt(0.5),0,0,Math.sqrt(0.5)));
        q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-orient));
        callback(q.w,q.x,q.y,q.z);
        return;
        */

        var q=getQuaternion(event.alpha,event.beta,event.gamma);
        callback(q[0],q[1],q[2],q[3]);
    });
}

function leftPos(elem) {
    var curleft = 0;
    if (elem.offsetParent) {
        do { 
            curleft +=elem.offsetLeft; 
        } while (elem = elem.offsetParent);
    }
    return curleft;
};

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

function multiplyMatrix(a,b){
    var m=
        [
                    a[0] *b[0]+a[1] *b[4]+a[2] *b[8]+a[3] *b[12], a[0] *b[1]+a[1] *b[5]+a[2] *b[9]+a[3] *b[13], a[0] *b[2]+a[1] *b[6]+a[2] *b[10]+a[3] *b[14], a[0] *b[3]+a[1] *b[7]+a[2] *b[11]+a[3] *b[15],
                       a[4] *b[0]+a[5] *b[4]+a[6] *b[8]+a[7] *b[12], a[4] *b[1]+a[5] *b[5]+a[6] *b[9]+a[7] *b[13], a[4] *b[2]+a[5] *b[6]+a[6] *b[10]+a[7] *b[14], a[4] *b[3]+a[5] *b[7]+a[6] *b[11]+a[7] *b[15],
                       a[8] *b[0]+a[9] *b[4]+a[10]*b[8]+a[11]*b[12], a[8] *b[1]+a[9] *b[5]+a[10]*b[9]+a[11]*b[13], a[8] *b[2]+a[9] *b[6]+a[10]*b[10]+a[11]*b[14], a[8] *b[3]+a[9] *b[7]+a[10]*b[11]+a[11]*b[15],
                       a[12]*b[0]+a[13]*b[4]+a[14]*b[8]+a[15]*b[12], a[12]*b[1]+a[13]*b[5]+a[14]*b[9]+a[15]*b[13], a[12]*b[2]+a[13]*b[6]+a[14]*b[10]+a[15]*b[14], a[12]*b[3]+a[13]*b[7]+a[14]*b[11]+a[15]*b[15]
        ];
    return m;
}

function multiplyMatrixs(list){
    if(list.length==1){
        return list[0];
    }
    var t=[multiplyMatrix(list[1],list[0])];
    for(var j=2;j<list.length;++j){
        t.push(list[j]);
    }
    return multiplyMatrixs(t);
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

function isMobile(){
    if(/AppleWebKit.*Mobile/i.test(navigator.userAgent) 
            || /Android/i.test(navigator.userAgent) 
            || /BlackBerry/i.test(navigator.userAgent) 
            || /IEMobile/i.test(navigator.userAgent) 
            || (/MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(navigator.userAgent))){
                if(/iPad/i.test(navigator.userAgent)){
                    if(/MicroMessenger/i.test(navigator.userAgent)){
                        return 3; //微信
                    }
                    return 2;//平板
                }else{
                    if(/MicroMessenger/i.test(navigator.userAgent)){
                        return 3; //微信
                    }
                    return 1;//手机
                }
            }else{
                return 0;
            }
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
function rotation2Position(z,rx,ry){
    z=-z;
    rx=-rx;

    var x=snot.cubeSize/2;
    var y=snot.cubeSize/2;

    var transform = text2Matrix( 'translate3d('+x+'px,'+y+'px,0) rotateY('+(0)+'deg) rotateX('+(0)+'deg) rotateY('+(ry?-ry:0)+'deg) rotateX('+(rx?-rx:0)+'deg) translateZ('+z+'px)' );
    return [-transform[12]+snot.cubeSize/2,transform[13]-snot.cubeSize/2,-transform[14]];

}

