/**
 * Created by atg on 14/05/2014.
 */
//Common baseline for visualisation app

function BaseApp() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.container = null;
    this.projector = null;
    this.objectList = [];
    this.root = null;
    this.mouse = { startX:0, startY:0, down:false, endX:0, endY:0};
    this.pickedObjects = [];
    this.hoverObjects = [];
    this.startTime = 0;
    this.elapsedTime = 0;
    this.clock = new THREE.Clock();
}

BaseApp.prototype.init = function(container) {
    this.container = container;
    console.log("BaseApp container =", container);
    this.createRenderer();
    console.log("BaseApp renderer =", this.renderer);
    this.createCamera();
    this.createControls();
    this.projector = new THREE.Projector();
    this.stats = initStats();
    this.statsShowing = true;
    //DEBUG
    $("#Stats-output").hide();
    this.statsShowing = false;
};

BaseApp.prototype.createRenderer = function() {
    this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
    this.renderer.setClearColor(0x5c5f64, 1.0);
    this.renderer.shadowMapEnabled = true;
    this.renderer.setSize(this.container.clientWidth, window.innerHeight*0.8);
    this.container.appendChild( this.renderer.domElement );
    var _this = this;

    this.container.addEventListener('mousedown', function(event) {
        _this.mouseClicked(event);
    }, false);
    this.container.addEventListener('mouseup', function(event) {
        _this.mouseClicked(event);
    }, false);
    this.container.addEventListener('mousemove', function(event) {
        _this.mouseMoved(event);
    }, false);
    window.addEventListener('resize', function(event) {
        _this.windowResize(event);
    }, false);
};

BaseApp.prototype.keydown = function(event) {
    //Key press functionality
    switch(event.keyCode) {
        case 83: //'S'
            if (this.stats) {
                if (this.statsShowing) {
                    $("#Stats-output").hide();
                    this.statsShowing = false;
                } else {
                    $("#Stats-output").show();
                    this.statsShowing = true;
                }
            }
            break;
    }
};

BaseApp.prototype.mouseClicked = function(event) {
    //Update mouse state
    if(event.type == 'mouseup') {
        this.mouse.endX = event.clientX;
        this.mouse.endY = event.clientY;
        this.mouse.down = false;
        return;
    }
    this.mouse.startX = event.clientX;
    this.mouse.startY = event.clientY;
    this.mouse.down = true;

    var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
    this.projector.unprojectVector(vector, this.camera);

    var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

    this.pickedObjects.length = 0;
    this.pickedObjects = raycaster.intersectObjects(this.scene.children, true);
};

BaseApp.prototype.mouseMoved = function(event) {
    //Update mouse state
    this.mouse.endX = event.clientX;
    this.mouse.endY = event.clientY;
};

BaseApp.prototype.windowResize = function(event) {
    //Handle window resize
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( this.container.clientWidth, window.innerHeight*0.8 );
    //console.log('Size =', )
};

BaseApp.prototype.createScene = function() {
    this.scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight(0x383838);
    this.scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(300, 300, 300);
    spotLight.intensity = 1;
    this.scene.add(spotLight);
};

BaseApp.prototype.createCamera = function() {

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.set( 0, 0, 250 );

    console.log('dom =', this.renderer.domElement);
};

BaseApp.prototype.createControls = function() {
    this.controls = new THREE.TrackballControls(this.camera, this.container);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 1.0;

    this.controls.noZoom = false;
    this.controls.noPan = true;
    this.controls.noRotate = true;
    this.controls.noRoll = true;

    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;

    this.controls.keys = [ 65, 83, 68 ];

    var lookAt = new THREE.Vector3(0, 0, 0);
    this.controls.setLookAt(lookAt);
};

BaseApp.prototype.update = function() {
    //Do any updates
    this.controls.update();
};

BaseApp.prototype.run = function(timestamp) {
    //Calculate elapsed time
    if (this.startTime === null) {
        this.startTime = timestamp;
    }
    this.elapsedTime = timestamp - this.startTime;

    this.renderer.render( this.scene, this.camera );
    var self = this;
    this.update();
    this.stats.update();
    requestAnimationFrame(function(timestamp) { self.run(timestamp); });
};

function initStats() {

    var stats = new Stats();

    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    $("#Stats-output").append( stats.domElement );

    return stats;
}