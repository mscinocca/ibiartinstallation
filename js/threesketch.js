var container;
var camera, scene, renderer;
var uniforms;
var stats;

var width = 1920 / 1.0, height = 1080 / 1.0, bytes = 4;

var data = new Uint8Array( width * height * bytes );

var programData = new Array(width);

var canvasBuffer = 100.0;

var trips = [];

var minLongitude = -79.582259;
var maxLongitude = -79.206532;
var minLatitude = 43.588199;
var maxLatitude = 43.837695;

var deltaTime = 0.0;

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

function runSketch() {

  init();
  animate();
}

function init() {

  container = document.getElementById( 'container' );

  viewRatio = 1080.0 / 1920.0;

  camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
  scene = new THREE.Scene();

  var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

  for(var i = 0; i < programData.length; i++) {
    programData[i] = new Array(height);
  }

  for(var i = 0; i < programData.length; i++) {
    for(var j = 0; j < programData[0].length; j++) {

        programData[i][j] = 0; //Math.random() * 256;

        setDataBuffer(i, j, programData[i][j]);
    }
  }

  var ibiX = Math.floor(getXPosition(-79.396541));
  var ibiY = Math.floor(getYPosition(43.687253));

  for(var x = ibiX - 2; x < ibiX + 2; x++) {
    for(var y = ibiY - 2; y < ibiY + 2; y++) {
      bumpAlphaColor(x, y, 255, 0, 255, 50);
    }
  }

  texture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat );
  texture.needsUpdate = true;

  uniforms = {
    texture: { type: 't', value: texture },
    time: { value: 1.0 },
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
  renderer.setPixelRatio( window.devicePixelRatio );

  container.appendChild( renderer.domElement );

  onWindowResize();

  window.addEventListener( 'resize', onWindowResize, false );

  stats	= new Stats();

  stats.domElement.style.position	= 'absolute';
  stats.domElement.style.left	= '0px';
  stats.domElement.style.bottom	= '0px';
  document.body.appendChild( stats.domElement );

  var loadCount = 0;
  var loadStart = 0;
  var loadEnd = 16;

  for(var i = loadStart; i < loadEnd; i++) {
    console.log(`history${i}.json`);

    $.getJSON(`transformeddata\\history${i}.json`, function(json) {
      var trip = json;

      trip.currentPlaceMark = 0;
      trip.currentCoord = 0;

      trips.push(trip);

      loadCount++;
    });
  }

  //while(loadCount < loadNumber) { }
}

function setDataBuffer(x, y, value) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i] = value;
  data[i + 1] = 0;
  data[i + 2] = value;
  data[i + 3] = value / 5.0;
}

function setDataBufferRGBA(x, y, r, g, b, a) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

function bumpAlphaColor(x, y, r, g, b, aFactor) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = Math.min(255, Math.max(200, data[i + 3] * aFactor));
}

function bumpAlpha(x, y) {
  var i = Math.floor(y) * width * bytes + Math.floor(x) * bytes;

  data[i + 3] = Math.max(255, data[i + 3] * 20.0);
}

function onWindowResize( event ) {

  //renderer.setViewport(0, 200, window.innerWidth, window.innerWidth * viewRatio);
  renderer.setSize( window.innerWidth,  window.innerHeight);
  renderer.setPixelRatio( window.devicePixelRatio );
}
function getXPosition(longitude) {
  return (width - canvasBuffer) * (longitude - minLongitude) / (maxLongitude - minLongitude) + canvasBuffer / 2;
}

function getYPosition(latitude) {
  return ((height - canvasBuffer) * (latitude - minLatitude) / (maxLatitude - minLatitude) + canvasBuffer / 2);
}

function animate( timestamp ) {

  stats.begin();

  uniforms.time.value = timestamp / 1000;

  if(timestamp) {
    deltaTime += timestamp / 1000;
  }

  for(var i = 0; i < trips.length; i++) {
    if(deltaTime >= 100.0 || (trips[i] != null && trips[i].currentPlaceMark == 0 && trips[i].currentCoord == 0)) {
      if(trips[i] != null) {
        if(trips[i].currentPlaceMark < trips[i].kml.Document.Placemark.length) {
          if(!Array.isArray(trips[i].kml.Document.Placemark[trips[i].currentPlaceMark]['gx:Track']['gx:coord'])) {
            trips[i].currentPlaceMark++;
          } else {
            if(trips[i].currentCoord < trips[i].kml.Document.Placemark[trips[i].currentPlaceMark]['gx:Track']['gx:coord'].length - 1) {
              var coord = trips[i].kml.Document.Placemark[trips[i].currentPlaceMark]['gx:Track']['gx:coord'][trips[i].currentCoord].split(" ");
              
              var coordNext = trips[i].kml.Document.Placemark[trips[i].currentPlaceMark]['gx:Track']['gx:coord'][trips[i].currentCoord + 1].split(" ");

              var x = Math.floor(getXPosition(parseFloat(coord[0])));
              var y = Math.floor(getYPosition(parseFloat(coord[1])));

              var xNext = Math.floor(getXPosition(parseFloat(coordNext[0])));
              var yNext = Math.floor(getYPosition(parseFloat(coordNext[1])));

              var deltaX = xNext - x;
              var deltaY = yNext - y;

              var xPos = x;
              var yPos = y;

              var deltaLength = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

              var moveDeltaX = deltaX / deltaLength;
              var moveDeltaY = deltaY / deltaLength;

              var xDelta = 0.0;
              var yDelta = 0.0;

              while(Math.abs(xDelta) < Math.abs(deltaX) && Math.abs(yDelta) < Math.abs(deltaY)) {

                var color = Math.max(128, Math.random() * 255);

                //for(var xx = xPos - 1; xx <= xPos + 1; xx++) {
                  //for(var yy = yPos - 1; yy <= yPos + 1; yy++) {
                    if(trips[i].kml.Document.Placemark[trips[i].currentPlaceMark].name == 'Walking') {
                      bumpAlphaColor(xPos, yPos, color, 0, color, 20.0);
                    } else {
                      bumpAlphaColor(xPos, yPos, 0, color, color, 20.0);
                    }  
                  //}
                //}

                if(Math.abs(xDelta) < Math.abs(deltaX)) {
                  xPos += moveDeltaX;
                  xDelta += moveDeltaX;
                }

                if(Math.abs(yDelta) < Math.abs(deltaY)) {
                  yPos += moveDeltaY;
                  yDelta += moveDeltaY;
                }
              }

              trips[i].currentCoord++;
            } else {
              trips[i].currentPlaceMark++;
              trips[i].currentCoord = 0;
            }
          }
        }
      }
    }
  }

  if(deltaTime >= 100.0) {
    deltaTime = 0.0;
  }

  texture.needsUpdate = true;

  renderer.render( scene, camera );

  stats.end();

  requestAnimationFrame( animate );
}