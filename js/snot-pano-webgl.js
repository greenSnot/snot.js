!function(global) {
    
    var snot={
         moveRatio:0.3,
         touchMoveDisabled:false,
         autoRotate:0,
         smooth:1-0.17,
         quaternion:{},
         frames:0,
         cubeSize : 1024,
         rz:0,
         ry : 0,       // Rotate * degree around y axis
         rx : 0,       // Rotate * degree around x axis
         maxfov : 120, // Max field of view (degree)
         minfov : 60,  // Min field of view (degree)
         fov : 90,     // Default field of view
    };
    global.snot= global.snot|| snot;
    var camera,scene,renderer;
    var boxMaterials=[];
    var suspects=[];
    var sprites={};
    var _ry;
    var _rx;
    var _overdraw=1;
    THREE.ImageUtils.crossOrigin='*';

    var spotsIndex=[];
    var mouseDownX;
    var mouseDownRx;
    var mouseDownRy;
    var mouseDownY;
    var isMouseDown=false;

     function _pointStandardlization(x,y,z){
         var ratio=200/distance3D(x,y,z,0,0,0);
         return [x*ratio,y*ratio,z*ratio];
     }
    //0     1    2    3    4   5
    //front down left back top right
    //front down left back top right
    var imgIndexConvert=[3,0,4,1,5,2];
    var imgLoaded=0;
    function loadPreviewImgs(imgs){
        var imgLoader=THREE.ImageUtils;
        for(var index =0;index<6;++index){
            var imgUrl=imgs[imgIndexConvert[index]];
            if(boxMaterials.length<6){
    	        boxMaterials.push( new THREE.MeshBasicMaterial( {
    	        	map: imgLoader.loadTexture(imgUrl,THREE.UVMapping,imgOnload),
                    overdraw:_overdraw
    	        } ) );
            }else{
    	        boxMaterials[index].map= imgLoader.loadTexture(imgUrl,THREE.UVMapping,imgOnload);
            }
        }
    }
    function loadOriginalImgs(imgs){
        var imgLoader=THREE.ImageUtils;
        for(var index=0;index<6;++index){
            var imgUrl=imgs[imgIndexConvert[index]];
            !function(index){
                var img;
                function onload(){
                    scene.children[0].material.materials[index].map=img;
                }
                img=imgLoader.loadTexture(imgUrl,THREE.UVMapping,onload);
            }(index);
        }
    }
    function imgOnload(){
        imgLoaded++;
        if(imgLoaded==6){
            loadOriginalImgs(snot.imgs_original);
        }
    }
    
    function genText(x,y,z,text,size,rotationX,color){
        var rate=20;
    
        var canvas = document.createElement("canvas");
        var context=canvas.getContext('2d');
        var ch=parseInt(canvas.height);
        var cw=parseInt(canvas.width);
        function drawCanvas(text,size){
            context=canvas.getContext('2d');
            context.font = size+"px STHeiti";
            if(!color){
                context.shadowOffsetX = 5;
                context.shadowOffsetY = 5;
                context.shadowBlur = 20;
                context.shadowColor = 'rgba(0,0,0,1)';
                context.fillStyle = '#fff';
            }else{
                context.fillStyle = color;
            }
            context.textAlign='center';
            context.textBaseline='middle';
        }
        drawCanvas(text,size);
        canvas.width=parseInt(context.measureText(text).width+10);
        ch=parseInt(canvas.height);
        cw=parseInt(canvas.width);
        drawCanvas(text,size);
        context.fillText(text,cw/2,ch/2);
    
        var geom=new THREE.PlaneGeometry(cw/rate,ch/rate, 1, 1);
        var cTexture=new THREE.Texture(canvas);
        var mat = new THREE.MeshBasicMaterial({map:cTexture,transparent:true,overdraw:_overdraw});
        cTexture.needsUpdate=true;
        var mesh = new THREE.Mesh(geom, mat);
    
        mesh.position.set(x,y,z);
    
        if(rotationX){
            rotationX=rotationX*Math.PI/180;
            mesh.rotation.x=rotationX;
        }else{
            var rotation=position2rotation(x,z,y);
            rotation.ry=270-rotation.ry;
            rotation.ry=rotation.ry<0?rotation.ry+360:rotation.ry;
            mesh.rotation.y=rotation.ry*Math.PI/180;
        }
    
        return mesh;
    }
    function _init(config) {
        $('#camera').remove();
        imgLoaded=0;
        for(var i in config){
            snot[i]=config[i];
        }
        var smooth=snot.smooth;
        snot.smooth=0;
        for(var i in sprites){
            scene.remove(scene.getObjectByName(i));
        }
        sprites={};
        var rx=snot.rx;
        var ry=snot.ry;

        if(snot.times>0){
            loadPreviewImgs(config.imgs_preview);
            loadSprites(config.sprites);
            if(config.callback){
                config.callback();
            }
            return;
        }
    
    	var container = document.getElementById( 'container' );
    
    	camera = new THREE.PerspectiveCamera( snot.fov, window.innerWidth / window.innerHeight, 1, 1100 );
    	camera.target = new THREE.Vector3( 0, 0, 0 );
        snot.camera=camera;
    
    	scene = new THREE.Scene();
    
        snot.scene=scene;

        if(config.callback){
            config.callback();
        }
        var size=snot.cubeSize;
        var precision=1;
    	var geometry = new THREE.BoxGeometry( size, size,size,precision,precision,precision);
        loadPreviewImgs(config.imgs_preview);
        var material= new THREE.MeshFaceMaterial(boxMaterials);
        var mesh = new THREE.Mesh( geometry, material );
        mesh.scale.x=-1;

        scene.add( mesh );

    	var SphereGeometry = new THREE.SphereGeometry(snot.cubeSize*1.8,32,32);
        var SphereMaterial=new THREE.MeshBasicMaterial({color:0xff00ff,side:THREE.DoubleSide});
        var SphereMesh=new THREE.Mesh(SphereGeometry,SphereMaterial);
        scene.add( SphereMesh);
        suspects.push(SphereMesh);

        if(!isAndroid()){
            loadSprites(config.sprites);
        }
        loadSprites(config.sprites);
    
        renderer = new THREE.WebGLRenderer();
        
    	renderer.setPixelRatio( window.devicePixelRatio );
    	renderer.setSize( window.innerWidth, window.innerHeight );
    	container.appendChild( renderer.domElement );
    
        container.addEventListener( 'touchstart', onDocumentMouseDown, false );
        container.addEventListener( 'touchmove', onDocumentMouseMove, false );
        container.addEventListener( 'touchend', onDocumentMouseUp, false );

        container.addEventListener( 'mousedown', onDocumentMouseDown, false );
        container.addEventListener( 'mousemove', onDocumentMouseMove, false );
        container.addEventListener( 'mouseup', onDocumentMouseUp, false );
        container.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
        //container.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
    
        animate();
        snot.smooth=smooth;
    }
    
    function onDocumentMouseDown( event ) {
    
    	event.preventDefault();
    
        isMouseDown=true;
        var x=parseInt(event.clientX>=0?event.clientX:event.changedTouches[0].clientX);
        var y=parseInt(event.clientY>=0?event.clientY:event.changedTouches[0].clientY);
    	mouseDownX=x;
    	mouseDownY =y;
    	mouseDownRy = snot.ry;
    	mouseDownRx = snot.rx;
    
    }

    
    function onDocumentMouseMove( event ) {

        if(!isMouseDown||snot.touchMoveDisabled){
            return;
        }

        var x=parseInt(event.clientX>=0?event.clientX:event.touches[0].pageX);
        var y=parseInt(event.clientY>=0?event.clientY:event.touches[0].pageY);

        if(event.touches&&event.touches.length>1){
            return;
        }

        _ry = ( mouseDownX - x ) * snot.moveRatio+mouseDownRy;
        _rx = ( y - mouseDownY) * snot.moveRatio + mouseDownRx;
        _rx=_rx>=90?89:_rx;
        _rx=_rx<=-90?-89:_rx;
    
        snot.rx=_rx;
        snot.ry=_ry;
    }
    
    function onDocumentMouseUp( event ) {
        isMouseDown=false;
        var x=parseInt(event.clientX>=0?event.clientX:event.changedTouches[0].pageX);
        var y=parseInt(event.clientY>=0?event.clientY:event.changedTouches[0].pageY);

        if(distance2D(x,y,mouseDownX,mouseDownY)<5){//单击
            var raycaster=new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.set( ( x / window.innerWidth ) * 2 - 1, - ( y / window.innerHeight ) * 2 + 1 );
            raycaster.setFromCamera( mouse, camera );
            raycaster.far=snot.cubeSize*2;
            var intersects = raycaster.intersectObjects(suspects);
            if ( intersects.length !=0 ) {
                var point=intersects[0].point;
                if(intersects[0].object.data){
                    snot.onSpriteClick(intersects[0].object.data);
                }else{
                    standard=_pointStandardlization(point.x,point.y,point.z);
                    var rotation=position2rotation(point.x,point.y,point.z);
                    snot.onClick(standard[0],standard[1],standard[2],rotation.rx,rotation.ry);
                }
            }
        }
    }
    
    function onDocumentMouseWheel( event ) {
    
    	// WebKit
    
    	if ( event.wheelDeltaY ) {
    
    		snot.fov -= event.wheelDeltaY * 0.05;
    
    	// Opera / Explorer 9
    
    	} else if ( event.wheelDelta ) {
    
    		snot.fov -= event.wheelDelta * 0.05;
    
    	// Firefox
    
    	} else if ( event.detail ) {
    
    		snot.fov += event.detail * 1.0;
    
    	}
        snot.fov=snot.fov>snot.maxfov?snot.maxfov:snot.fov;
        snot.fov=snot.fov<snot.minfov?snot.minfov:snot.fov;

    }
    
    function animate() {
    
        requestAnimationFrame( animate );
        update();
    
    }
    
    function update() {
    
    	snot.ry += snot.autoRotate;

        var rx=snot.rx;
        var ry=snot.ry;
        var rz=snot.rz*Math.PI/180;

        ry = THREE.Math.degToRad(  ry+180);
        rx = THREE.Math.degToRad(  rx-90);

        camera.autoUpdateMatrix = false;

        var q = new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3(0,-1,0),ry);
        rx+=Math.PI/2;
        q = new THREE.Quaternion().multiplyQuaternions(q,new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3(1,0,0),rx));
        q = new THREE.Quaternion().multiplyQuaternions(q,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),rz));

        var newQuaternion = new THREE.Quaternion();
        THREE.Quaternion.slerp( camera.quaternion, q, newQuaternion, 1-snot.smooth );
        camera.quaternion.copy(newQuaternion);
        camera.quaternion.normalize();

        camera.fov=snot.fov;
    	camera.updateProjectionMatrix();
    	renderer.render( scene, camera );
    }

    function _setFov(fov){
        snot.fov=fov;
        snot.fov=snot.fov>snot.maxfov?snot.maxfov:snot.fov;
        snot.fov=snot.fov<snot.minfov?snot.minfov:snot.fov;
    }
    function _setRx(rx){
        snot.rx=rx;
    }
    function _setRy(ry){
        snot.ry=ry;
    }
    function _setRz(rz){
        snot.rz=rz;
    }
    function _setQuaternion(w,x,y,z){
        snot.quaternion={
            w:w,
            x:x,
            y:y,
            z:z
        }
    }
    function loadSprites(sps){
        for(var i in sps){
            var functionName='gen'+sps[i].spriteType[0].toUpperCase()+(sps[i].spriteType.substr(1));
            var mesh=snot[functionName](sps[i]);

            mesh.data=sps[i];
            sprites[mesh.name]=true;
            suspects.push(mesh);
            scene.add(mesh);

        }
    }
    $.extend(global.snot,{
       setFov: _setFov,
       setRx: _setRx,
       setRy: _setRy,
       setRz: _setRz,
       genText:genText,
       setQuaternion:_setQuaternion,
       init: _init,
       loadSprites: loadSprites
    });
}(window);
