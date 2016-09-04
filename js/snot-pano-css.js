!function(global) {

  var dom_offset_top;
  var dom_offset_left;
  var snot={

    cameraLookAt:{
      x: 0,
      y: 0,
      z: 1,
    },
    movingRatio:0.3,
    autoRotation:0,
    frames:0,
    imgs_rotation:[0,0,0,0,0,0],

    pauseAnimation: false,

    dom       : document.getElementById('snot-pano'),
    camera   : document.getElementById('camera'),
    container: document.getElementById('container'),

    cubeSize : 1024,

    ry : 0,       // Rotate * degree around y axis
    rx : 0,       // Rotate * degree around x axis
    maxfov : 120, // Max field of view (degree)
    minfov : 60,  // Min field of view (degree)
    fov : 90,     // Default field of view
    smooth : 0.17,
  }

  var _rx;
  var _ry;
  var _imageDownloaded=0;

  function _pointStandardlization(x,y,z){
    var ratio=200/distance3D(x,y,z,0,0,0);
    return [x*ratio,y*ratio,z*ratio];
  }

  global.snot= global.snot|| snot;

  var _setFov = function (degree) {

    if(degree<snot.minfov||degree>snot.maxfov){
      return;
    }

    snot.fov=degree;
    snot.container.style['-webkit-transform']='scale('+Math.tan(snot.maxfov/2*Math.PI/180)/Math.tan(snot.fov/2*Math.PI/180)+')';
  }

  function reset() {
    var sprites = document.getElementsByClassName('sprite');
    for (var i = 0; i < sprites.length; ++ i) {
      sprites[i].remove();
    }
  }

  var _init = function(config,ajax){
    reset();
    _imageDownloaded=0;

    cancelAnimationFrame(snot._animateId);

    for(var i in config){
      snot[i]=config[i];
    }

    dom_offset_left=leftPos(snot.dom);
    dom_offset_top=topPos(snot.dom);

    _rx=snot.rx;
    _ry=snot.ry;

    //First init
    if(!ajax){

      snot.width = snot.dom.offsetWidth;
      snot.height = snot.dom.offsetHeight;

      //compute the max Horizontal Field of view
      //perspective= projectiveScreenWidth/2
      //           = width/2/tan(maxfov/2)
      snot.perspective=snot.width/2/Math.tan(snot.maxfov/2*Math.PI/180);

      snot.container.style['-webkit-perspective']=snot.perspective+'px';

      //camera offset
      // Z is depth(front) Y is height X is right
      //
      // translateZ setFOV
      // rotateX rotate around X axis
      // rotateY rotate around Y axis
      // translateX translate the Camera to center
      // translateY
      snot.cameraBaseTransform='translateX('+epsilon((snot.cubeSize-snot.width)/-2)+'px) translateY('+epsilon((snot.cubeSize-snot.height)/-2)+'px)';
      snot.camera.style['-webkit-transform']='translateZ(-'+snot.perspective+'px) rotateX('+snot.rx+'deg) rotateY('+snot.ry+'deg)'+ snot.cameraBaseTransform;

    }
    _setFov(snot.fov);

    if(config.imgs_preview){
      loadImages(config.imgs_preview,config.imgs_original,config.imgs_rotation);
    }

    if(config){
      _loadSprites(config.sprites);
    }

    if ( is_mobile() ) {

      snot.container.addEventListener('touchstart',mouseDown,false);
      snot.container.addEventListener('touchmove' ,mouseMove,false);
      snot.container.addEventListener('touchend'  ,mouseUp  ,false);

    } else {

      snot.container.addEventListener('mousedown' ,mouseDown ,false);
      snot.container.addEventListener('mousemove' ,mouseMove ,false);
      snot.container.addEventListener('mouseup'   ,mouseUp   ,false);
      snot.container.addEventListener('mousewheel',mouseWheel,false);

    }

    if(config.callback){
      config.callback();
    }
  }

  function loadImages(imgs_preview,imgs_original,imgs_rotation,onPreviewImagesLoad){
    onPreviewImagesLoad=onPreviewImagesLoad?onPreviewImagesLoad:function(){console.log('Preview images loaded')};

    var _cubeConfig={

      front :"rotateY(90deg)"+"                rotateZ("+imgs_rotation[0]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px)",
      bottom:"rotateY(90deg)"+"rotateX(90deg)  rotateZ("+imgs_rotation[1]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px) rotateZ(90deg)",
      left  :"rotateY(90deg)"+"rotateY(90deg)  rotateZ("+imgs_rotation[2]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px)",
      back  :"rotateY(90deg)"+"rotateY(180deg) rotateZ("+imgs_rotation[3]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px)",
      top   :"rotateY(90deg)"+"rotateX(-90deg) rotateZ("+imgs_rotation[4]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px) rotateZ(-90deg)",
      right :"rotateY(90deg)"+"rotateY(-90deg) rotateZ("+imgs_rotation[5]+"deg)  translateZ(-" + (snot.cubeSize/2)+"px)"


    };

    var counter=0;
    var cubeDom;
    for(var i in _cubeConfig){
      cubeDom = document.getElementsByClassName('cube ' + i)[0];
      cubeDom.style['-webkit-transform'] = _cubeConfig[i];
      cubeDom.style['width'] = snot.cubeSize + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )
      cubeDom.style['height'] = snot.cubeSize + 2 + 'px';        // 2 more pixels for overlapping gaps ( chrome's bug )

      cubeDom.setAttribute('src', imgs_preview[counter]);
      cubeDom.setAttribute('data-index', counter);
      cubeDom.onload = function(){
        _imageDownloaded=_imageDownloaded>0?_imageDownloaded+1:1;
        if(_imageDownloaded==6){
          for(var i in _cubeConfig){
            var node = document.getElementsByClassName('cube ' + i)[0];
            node.setAttribute('src', imgs_original[node.getAttribute('data-index')]);
          }

        }
      }
      counter++;
    }
  }

  var touches = {

    fx:0,   // First  finger x
    fy:0,   // First  finger y
    sx:0,   // Second finger x
    sy:0    // Second finger y

  };

  var _loadSprites=function(sprites){
    for(var i in sprites){
      var t=sprites[i];
      if(t.standardlization){
        var standard=_pointStandardlization(t.x,t.y,t.z);
        t.x=standard[0];
        t.y=standard[1];
        t.z=standard[2];
      }

      var temp_wrapper = document.createElement('div');
      temp_wrapper.innerHTML = template(t.template,t);
      var element = temp_wrapper.firstChild;
      element.data=sprites[i];
      addSpriteByPosition(element,t.x,t.y,t.z);
    }
  }

  var rotate = function(x,y,z,rx,ry){
    var PI=Math.PI;
    var pos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().multiplyMatrices(
          new THREE.Matrix4().makeRotationAxis({x:0,y:1,z:0},-ry*PI/180),
          new THREE.Matrix4().makeRotationAxis({x:1,y:0,z:0},-rx*PI/180)
        ),
        new THREE.Matrix4().setPosition({x:x,y:y,z:z})
    ));
    return ([-pos.x,-pos.y,-pos.z]);
  }

  var addSpriteByRotation = function(element, rx, ry) {
    var rotation = rotate(x,y,z,rx,ry);
    addSpriteByPosition(element,rotation[0],rotation[1],rotation[2]);
  }

  var addSpriteByPosition=function(element,x,y,z){

    z=-z;
    y=-y;

    var spriteContainer = document.createElement('div');
    spriteContainer.style.display='inline-block';
    spriteContainer.style.position='absolute';
    spriteContainer.className="sprite-container";
    spriteContainer.id = element.data.id;

    spriteContainer.style['-webkit-transform-origin-x']='0';
    spriteContainer.style['-webkit-transform-origin-y']='0';

    var arc=x==0&&z==0?0:Math.acos(z/Math.pow(x*x+z*z,0.5));

    arc=x<0?2*Math.PI-arc:arc;
    arc=arc*180/Math.PI;

    var r=distance3D(x,y,z,0,0,0);
    x+=snot.cubeSize/2;
    y+=snot.cubeSize/2;

    spriteContainer.style['-webkit-transform']='translate3d('+epsilon(x)+'px,'+epsilon(y)+'px,'+epsilon(z)+'px) rotateY('+epsilon(arc)+'deg) rotateX('+epsilon((y-snot.cubeSize/2)/r*-90)+'deg) rotateY(180deg)';

    var spriteWrap = document.createElement('div');
    spriteWrap.className='sprite-wrap';
    spriteWrap.appendChild(element);

    spriteContainer.appendChild(spriteWrap);
    snot.camera.appendChild(spriteContainer);
  }

  var updateSpritePosition = function(id, x, y, z) {
    snot.sprites[id].x = x;
    snot.sprites[id].y = y;
    snot.sprites[id].z = z;
    z=-z;
    y=-y;
    var arc=x==0&&z==0?0:Math.acos(z/Math.pow(x*x+z*z,0.5));

    arc=x<0?2*Math.PI-arc:arc;
    arc=arc*180/Math.PI;

    var r=distance3D(x,y,z,0,0,0);
    x+=snot.cubeSize/2;
    y+=snot.cubeSize/2;

    var spriteContainer = document.getElementById(id);

    spriteContainer.style['-webkit-transform']='translate3d('+epsilon(x)+'px,'+epsilon(y)+'px,'+epsilon(z)+'px) rotateY('+epsilon(arc)+'deg) rotateX('+epsilon((y-snot.cubeSize/2)/r*-90)+'deg) rotateY(180deg)';
  }

  var mouseMove = function (event) {

    event.preventDefault();
    event.stopPropagation();

    var x=Math.floor(event.clientX>=0?event.clientX:event.touches[0].pageX);
    var y=Math.floor(event.clientY>=0?event.clientY:event.touches[0].pageY);
    x-=dom_offset_left;
    y-=dom_offset_top;

    touches.click=false;

    if(!touches.onTouching){

      return false;

    }

    if(event.touches&&event.touches.length>1){

      var cfx=x;                          // Current frist  finger x
      var cfy=y;                          // Current first  finger y
      var csx=event.touches[1].pageX;     // Current second finger x
      var csy=event.touches[1].pageY;     // Current second finger y

      var dis= distance2D(touches.fx,touches.fy,touches.sx,touches.sy)-distance2D(cfx,cfy,csx,csy);

      var ratio=0.12;
      snot.setFov(snot.fov+dis*ratio);

      touches.fx=cfx;
      touches.fy=cfy;
      touches.sx=csx;
      touches.sy=csy;

      return false;

    }

    var ratio=snot.movingRatio;

    _ry=_ry+(touches.fx-x)*ratio;
    _rx=_rx-(touches.fy-y)*ratio;

    touches.fx=x;
    touches.fy=y;

    _rx=_rx>90?90  :_rx;
    _rx=_rx<-90?-90:_rx;


    //TODO

  };

  var mouseDownX;
  var mouseDownY;
  var mouseDown = function (event) {

    event.preventDefault();
    event.stopPropagation();

    var x=Math.floor(event.clientX>=0?event.clientX:event.touches[0].clientX);
    var y=Math.floor(event.clientY>=0?event.clientY:event.touches[0].clientY);
    x-=dom_offset_left;
    y-=dom_offset_top;

    mouseDownX=x;
    mouseDownY=y;

    touches.fx=x;
    touches.fy=y;
    touches.click=true;

    if (event.touches&&event.touches.length>1) {

      touches.sx = event.touches[1].pageX;
      touches.sy = event.touches[1].pageY;

    }

    touches.onTouching = true;

  }

  var mouseWheel = function (event) {

    event.preventDefault();
    event.stopPropagation();

    var offset=event.deltaY;
    snot.setFov(snot.fov+offset*0.06);

  }

  function multiply(mats){
    if (mats.length == 2) {
      return new THREE.Matrix4().multiplyMatrices(
        mats[0],
        mats[1]
      );
    }
    for (var i in mats) {
      var last2 = mats[mats.length - 2];
      var last1 = mats[mats.length - 1];
      mats[mats.length - 2] = new THREE.Matrix4().multiplyMatrices(
        last2,
        last1
      );
      mats.pop();
      return multiply(mats);
    }
  }

  function onClick (x, y) {
    var R=100;
    var fov = snot.fov;
    var cubeSize = snot.cubeSize;
    var arcFactor = Math.PI/180;
    var rz = snot.rz*arcFactor;
    var width = snot.width;
    var height = snot.height;

    var ry=(x/width-0.5)*fov;
    var rx=(y/height-0.5)*fov*height/width;
    var r=Math.cos(fov/2*arcFactor)*cubeSize;
    var ratiox=(x-width/2)/width*2;
    var ratioy=(y-height/2)/width*2;
    var P=Math.sin(fov/2*arcFactor)*cubeSize;

    ry=Math.atan(ratiox*P/r);
    rx=Math.atan(ratioy*P/r);

    ry*=180/Math.PI;
    rx*=180/Math.PI;

    var xyz2=rotation2Position(R,rx,0);

    var rr=distance3D(-Math.tan(ry*arcFactor)*xyz2[2],-xyz2[1],xyz2[2],0,0,0);
    var ratio=R/rr;

    var new_x = -Math.tan(ry*Math.PI/180)*xyz2[2]*ratio;
    var new_y = -xyz2[1]*ratio;
    var new_z = xyz2[2]*ratio;

    var pos = new THREE.Vector3().setFromMatrixPosition(multiply([
      new THREE.Matrix4().makeRotationAxis({x:0,y:1,z:0},-snot.ry*Math.PI/180),
      new THREE.Matrix4().makeRotationAxis({x:0,y:0,z:1},-snot.rz*Math.PI/180),
      new THREE.Matrix4().makeRotationAxis({x:1,y:0,z:0},-snot.rx*Math.PI/180),
      new THREE.Matrix4().setPosition({x:new_x,y:new_y,z:new_z})
    ]));

    ax = -pos.x;
    ay = pos.y;
    az = pos.z;

    var minOffset=0.4;
    var minDistance=snot.minDetectDistance;
    var nearest;

    var spriteContainers = document.getElementsByClassName('sprite-container');
    for (var i = 0 ;i < spriteContainers.length; ++i) {
      var self = spriteContainers[i];
      var matrix = text2Matrix(self.style.webkitTransform);
      var rate_ = 100 / distance3D(0, 0, 0, snot.cubeSize / 2 - matrix[12], matrix[13] - snot.cubeSize / 2, - matrix[14]);

      var distance = distance3D(-ax, -ay, az, (snot.cubeSize / 2 - matrix[12]) * rate_, rate_ * (matrix[13] - snot.cubeSize / 2), rate_ * ( - matrix[14]));
      if (distance < minDistance) {
        minDistance = distance;
        nearest = self.children[0];
      }
    };

    var rotation=position2rotation(ax,az,ay);
    if(nearest){
      snot.onSpriteClick(snot.sprites[nearest.parentElement.id],nearest);
    }else{
      snot.onClick(ax,ay,az,rotation[0],rotation[1]);
    }
  }

  var mouseUp = function (event) {
    event.preventDefault();
    event.stopPropagation();

    var x=Math.floor(event.clientX>=0?event.clientX:event.changedTouches[0].pageX);
    var y=Math.floor(event.clientY>=0?event.clientY:event.changedTouches[0].pageY);
    x-=dom_offset_left;
    y-=dom_offset_top;

    //Screen coordinate to Sphere 3d coordinate
    if (distance2D(mouseDownX,mouseDownY,x,y)<5) {
      onClick(x, y);
    }
    touches.onTouching=false;
  }

  function _run() {
    snot._animateId=requestAnimationFrame( _run );
    if(!snot.pauseAnimation){
      _update();
    }
  }

  function toMat(q) {

    var w = q['w'];
    var x = -q['x'];
    var y = q['y'];
    var z = -q['z'];

    var n = w * w + x * x + y * y + z * z;
    var s = n === 0 ? 0 : 2 / n;
    var wx = s * w * x, wy = s * w * y, wz = s * w * z;
    var xx = s * x * x, xy = s * x * y, xz = s * x * z;
    var yy = s * y * y, yz = s * y * z, zz = s * z * z;

    return [
      1 - (yy + zz), xy - wz, xz + wy, 0,
        xy + wz, 1 - (xx + zz), yz - wx, 0,
        xz - wy, yz + wx, 1 - (xx + yy), 0,
        0, 0, 0, 1];
  }

  function _update() {
    snot.frames++;

    if (vars.alpha === -1 && vars.beta === -1 && vars.gamma === -1)
      return;
    var zee = new THREE.Vector3( 0, 0, 1 );

    var euler = new THREE.Euler();

    var q0 = new THREE.Quaternion();

    var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis
    var quaternion = new THREE.Quaternion();
    euler.set( vars.beta, vars.alpha, - vars.gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

    quaternion.setFromEuler( euler ); // orient the device

    quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

    quaternion.multiply( q0.setFromAxisAngle( zee, - screen_orientation) ); // adjust for screen orientation
    var newQuaternion = new THREE.Quaternion();
    THREE.Quaternion.slerp( quaternion, previous_quat , newQuaternion, 1 - snot.smooth);
    previous_quat = newQuaternion;
    var mat = toMat(newQuaternion);
    var mat4= {elements:mat};
    var a=new THREE.Euler().setFromRotationMatrix(mat4,'XZY');

    snot.rx = a._x*180/Math.PI;
    snot.ry = a._y*180/Math.PI;
    snot.rz = a._z*180/Math.PI;

    var cameraLookAt = new THREE.Vector3().setFromMatrixPosition(multiply([
      new THREE.Matrix4().makeRotationAxis({x:0,y:1,z:0},-snot.ry*Math.PI/180),
      new THREE.Matrix4().makeRotationAxis({x:0,y:0,z:1},-snot.rz*Math.PI/180),
      new THREE.Matrix4().makeRotationAxis({x:1,y:0,z:0},-snot.rx*Math.PI/180),
      new THREE.Matrix4().setPosition({x: 0, y: 0,z: 1})
    ]));

    snot.cameraLookAt.x = -cameraLookAt.x;
    snot.cameraLookAt.y = cameraLookAt.y;
    snot.cameraLookAt.z = cameraLookAt.z;

    //$('#logger').html(Math.floor(snot.rx)+','+ Math.floor(snot.ry) +','+ Math.floor(snot.rz));
    snot.camera.style.transform = 'translateZ('+epsilon(snot.perspective)+'px)'+" matrix3d(" + mat + ")"+ snot.cameraBaseTransform;
  }
  var previous_quat = new THREE.Quaternion();

  var screen_orientation = 0;
  window.addEventListener( 'orientationchange', function(ev) {
    screen_orientation = window.orientation || 0;
  }, false );

  var vars = {
    alpha: 0,
    beta: 90 * Math.PI/180,
    gamma: 0
  };

  var varsDest = {
    alpha: 0,
    beta: 0,
    gamma: 0
  };

  window.addEventListener("deviceorientation", function(ev) {
    if (ev.alpha !== null) {
      vars.beta = ev.beta  * Math.PI/ 180 ;
      vars.gamma = ev.gamma  * Math.PI/ 180;
      vars.alpha = ev.alpha  * Math.PI/ 180;
    } else {
      vars.beta = vars.gamma = vars.alpha = -1;
    }
  }, true);


  var _setRx=function(rx,smooth){
    //TODO
  }

  var _setRy=function(ry,smooth){
    //TODO
  }

  function extend(obj, json) {
    for (var i in json) {
      obj[i] = json[i];
    }
  }

  extend(snot, {
    setFov: _setFov,
    setRx: _setRx,
    setRy: _setRy,
    init: _init,
    run: _run,
    update: _update,
    loadSprites: _loadSprites,
    updateSpritePosition: updateSpritePosition
  });
}(window);
