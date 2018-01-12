var container;
var camera, scene, renderer;
var uniforms;
var stats;

var width = 1920 / 1.0, height = 1080 / 1.0, bytes = 4;

var data = new Uint8Array( width * height * bytes );

var programData = new Array(width);

var canvasBuffer = 10.0;

var trips = [];

var minLongitude = -79.582259;
var maxLongitude = -79.206532;
var minLatitude = 43.588199;
var maxLatitude = 43.837695;

var lastTimeStamp = 0.0;
var deltaTime = 0.0;

var currentTripIndex = 0;

var xVector = 0.25;
var yVector = 0.50;

//43.676196, -79.495543
//43.658360, -79.487967
//43.678813, -79.474068
//43.664484, -79.457840
/*
var minLongitude = -79.495543;
var maxLongitude = -79.457840;
var minLatitude = 43.658360;
var maxLatitude = 43.676196;
*/

var speedFactor = 1;

function runSketch() {

  init();
  animate();
}

function init() {

  container = document.getElementById( 'container' );

  viewRatio = 1080.0 / 1920.0;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 10, 1.0, 1, 1000 ); //new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
  camera.position.z = 11.0;

  camera.lookAt(new THREE.Vector3(0, 0, 0));

  camera.updateProjectionMatrix();

  var geometry = new THREE.PlaneBufferGeometry( 2, 2, 100, 100 );

  for(var i = 0; i < programData.length; i++) {
    programData[i] = new Array(height);
  }

  for(var i = 0; i < programData.length; i++) {
    for(var j = 0; j < programData[0].length; j++) {

        setDataBufferColorA(i, j, 0, 0);
    }
  }

  var ibiX = Math.floor(getXPosition(-79.396541));
  var ibiY = Math.floor(getYPosition(43.687253));

  /*
  for(var x = ibiX - 10; x < ibiX + 10; x++) {
    for(var y = ibiY - 10; y < ibiY + 10; y++) {
      bumpAlphaColor(x, y, 255, 0, 255, 50);
    }
  }
  */

  texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat );
  texture.needsUpdate = true;

  uniforms = {
    texture: { type: 't', value: texture },
    time: { value: 1.0 },
    pathIndex: { value: 0.0 },
    xPosition: { value: width / 2.0 },
    yPosition: { value: height / 2.0 }
  };

  var material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
    transparent: true,
  });

  var mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  container.appendChild( renderer.domElement );

  onWindowResize();

  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'keydown', onKeyDown, false );

  stats	= new Stats();

  //stats.domElement.style.position	= 'absolute';
  //stats.domElement.style.left	= '0px';
  //stats.domElement.style.bottom	= '0px';
  //document.body.appendChild( stats.domElement );

  var loadCount = 0;
  var loadStart = 0;
  var loadEnd = 52;

  var loadNumber = loadEnd - loadStart + 1;

  for(var i = loadStart; i <= loadEnd; i++) {
    console.log(`history${i}.json`);

    $.getJSON(`transformeddata\\history${i}.json`, function(json) {
      var trip = json;

      trip.currentPlaceMark = 0;
      trip.currentCoord = 0;

      trip.deltaX = 0;
      trip.deltaY = 0;

      trip.xPos = 0;
      trip.yPos = 0;

      trip.moveDeltaX = 0;
      trip.moveDeltaY = 0;

      trip.movedDeltaX = 0.0;
      trip.movedDeltaY = 0.0;

      trip.color = 0;

      trips.push(trip);

      loadCount++;
    });
  }

  //while(loadCount < loadNumber) { sleep(1000); }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function setDataBufferColorA(x, y, color, a) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i] = color;
  data[i + 3] = a;
}

function setDataBufferColorInfo(x, y, color, pathIndex, a) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  if(a > data[i + 3] || pathIndex > data[i + 1]) {
    data[i] = color;
    data[i + 1] = pathIndex;
    data[i + 3] = a;
  }
}

function bumpAlphaColor(x, y, color, aFactor) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i] = color;
  data[i + 3] = Math.min(255, Math.max(200, data[i + 3] * aFactor));
}

function onWindowResize( event ) {

  renderer.setSize( window.innerWidth,  window.innerHeight);
}

function onKeyDown( event ) {
  if( event.keyCode == 38 ) {
    speedFactor++;
  } else if( event.keyCode == 40 ) {
    speedFactor--;

    if(speedFactor < 1) {
      speedFactor = 1;
    }
  }
}

function getXPosition(longitude) {
  return (width - canvasBuffer) * (longitude - minLongitude) / (maxLongitude - minLongitude) + canvasBuffer / 2;
}

function getYPosition(latitude) {
  return ((height - canvasBuffer) * (latitude - minLatitude) / (maxLatitude - minLatitude) + canvasBuffer / 2);
}

var zoom = -1;

function animate( timestamp ) {

  stats.begin();

  uniforms.time.value = timestamp;
  uniforms.pathIndex.value = currentTripIndex + 1;

  if(timestamp) {
    deltaTime += (timestamp - lastTimeStamp);

    lastTimeStamp = timestamp;
  }

  var timeSpeed = 40.0;

  var cameraZoom = 0.01;

  /*
  if(camera.left < -0.5) {
    camera.left += cameraZoom;
    camera.right -= cameraZoom;
    camera.top -= cameraZoom;
    camera.bottom += cameraZoom;
    camera.updateProjectionMatrix();
  }
  */

  //for(currentTripIndex = 0; currentTripIndex < trips.length; currentTripIndex++) {
    if(deltaTime >= timeSpeed && currentTripIndex < trips.length) {
      if(trips[currentTripIndex] != null) {
        if(trips[currentTripIndex].currentPlaceMark < trips[currentTripIndex].kml.Document.Placemark.length) {
          if(!Array.isArray(trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark]['gx:Track']['gx:coord'])) {
            trips[currentTripIndex].currentPlaceMark++;
          } else {
            if(trips[currentTripIndex].currentCoord < trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark]['gx:Track']['gx:coord'].length - 1) {
              
              if(trips[currentTripIndex].xPos == 0 && trips[currentTripIndex].yPos == 0) {
                var coord = trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark]['gx:Track']['gx:coord'][trips[currentTripIndex].currentCoord].split(" ");
                
                var coordNext = trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark]['gx:Track']['gx:coord'][trips[currentTripIndex].currentCoord + 1].split(" ");

                var x = Math.floor(getXPosition(parseFloat(coord[0])));
                var y = Math.floor(getYPosition(parseFloat(coord[1])));

                var xNext = Math.floor(getXPosition(parseFloat(coordNext[0])));
                var yNext = Math.floor(getYPosition(parseFloat(coordNext[1])));

                trips[currentTripIndex].deltaX = xNext - x;
                trips[currentTripIndex].deltaY = yNext - y;

                trips[currentTripIndex].xPos = x;
                trips[currentTripIndex].yPos = y;

                var deltaLength = Math.sqrt(Math.pow(trips[currentTripIndex].deltaX, 2) + Math.pow(trips[currentTripIndex].deltaY, 2));

                trips[currentTripIndex].moveDeltaX = trips[currentTripIndex].deltaX / deltaLength;
                trips[currentTripIndex].moveDeltaY = trips[currentTripIndex].deltaY / deltaLength;

                trips[currentTripIndex].movedDeltaX = 0.0;
                trips[currentTripIndex].movedDeltaY = 0.0;
              }

              var pointsPerFrame = 1;

              if(trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'Walking' || trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'Cycling') {
                trips[currentTripIndex].color = 1;
                pointsPerFrame = 1;
              } else if(trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'On the subway' || trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'On a tram' || trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'Moving') {
                trips[currentTripIndex].color = 2;
                pointsPerFrame = 2;
              } else if(trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'Motorcycling') {
                trips[currentTripIndex].color = 3;
                pointsPerFrame = 3;
              } else if(trips[currentTripIndex].kml.Document.Placemark[trips[currentTripIndex].currentPlaceMark].name == 'Driving') {
                trips[currentTripIndex].color = 4;
                pointsPerFrame = 3;
              } 

              pointsPerFrame = pointsPerFrame * speedFactor;

              for(var i = 0; i < pointsPerFrame; i++) {
                if(Math.abs(trips[currentTripIndex].movedDeltaX) < Math.abs(trips[currentTripIndex].deltaX) && Math.abs(trips[currentTripIndex].movedDeltaY) < Math.abs(trips[currentTripIndex].deltaY)) {

                  var maxFactor = 1.0;
                  var minFactor = 0.8;
                
                  var boxSize = 3.0;

                  for(var xx = trips[currentTripIndex].xPos - boxSize; xx <= trips[currentTripIndex].xPos + boxSize; xx++) {
                    for(var yy = trips[currentTripIndex].yPos - boxSize; yy <= trips[currentTripIndex].yPos + boxSize; yy++) {

                      var distance = Math.sqrt(Math.abs(xx - trips[currentTripIndex].xPos) * Math.abs(xx - trips[currentTripIndex].xPos) + Math.abs(yy - trips[currentTripIndex].yPos) * Math.abs(yy - trips[currentTripIndex].yPos));
                      var factor = (minFactor - maxFactor) / boxSize * distance + maxFactor;

                      if(factor > minFactor)
                        setDataBufferColorInfo(xx, yy, trips[currentTripIndex].color, currentTripIndex + 1, 255.0 * factor);
                    }
                  }

                  if(Math.abs(trips[currentTripIndex].movedDeltaX) < Math.abs(trips[currentTripIndex].deltaX)) {
                    trips[currentTripIndex].xPos += trips[currentTripIndex].moveDeltaX;
                    trips[currentTripIndex].movedDeltaX += trips[currentTripIndex].moveDeltaX;
                  }

                  if(Math.abs(trips[currentTripIndex].movedDeltaY) < Math.abs(trips[currentTripIndex].deltaY)) {
                    trips[currentTripIndex].yPos += trips[currentTripIndex].moveDeltaY;
                    trips[currentTripIndex].movedDeltaY += trips[currentTripIndex].moveDeltaY;
                  }
                } else {

                  trips[currentTripIndex].currentCoord++;

                  trips[currentTripIndex].xPos = 0;
                  trips[currentTripIndex].yPos = 0;

                  trips[currentTripIndex].movedDeltaX = 0.0;
                  trips[currentTripIndex].movedDeltaY = 0.0;

                  break;
                }
              }
            } else {
              trips[currentTripIndex].currentPlaceMark++;
              trips[currentTripIndex].currentCoord = 0;
            }
          }
        } else {
          currentTripIndex++;
        }
      }
    }
  //}

  if(deltaTime >= timeSpeed) {
    deltaTime = 0.0;
  }

  uniforms.xPosition.value += xVector;
  uniforms.yPosition.value += yVector;

  if(uniforms.xPosition.value > 1920 || uniforms.xPosition.value < 0) {
    xVector = -xVector;
  }

  if(uniforms.yPosition.value > 1080 || uniforms.yPosition.value < 0) {
    yVector = -yVector;
  }
  
  texture.needsUpdate = true;

  renderer.render( scene, camera );

  stats.end();

  requestAnimationFrame( animate );
}