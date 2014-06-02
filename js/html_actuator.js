var renderer, camera, scene, materials, cubeSize;

renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColorHex(0xccbbaa, 1);

camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.z = 1500;
scene = new THREE.Scene();
scene.allObjects = [];

cubeSize = 160;
materials = {
  2: new THREE.MeshLambertMaterial({color: 0xffffff}),
  4: new THREE.MeshLambertMaterial({color: 0x888888}),
  8: new THREE.MeshLambertMaterial({color: 0xff9944}),
  16: new THREE.MeshLambertMaterial({color: 0xee8844}),
  32: new THREE.MeshLambertMaterial({color: 0xee6633}),
  64: new THREE.MeshLambertMaterial({color: 0xee4422}),
  128: new THREE.MeshLambertMaterial({color: 0xe0bf5a}),
  256: new THREE.MeshLambertMaterial({color: 0xe0bc48}),
  512: new THREE.MeshLambertMaterial({color: 0xe0b835}),
  1024: new THREE.MeshLambertMaterial({color: 0xe0b51e}),
  2048: new THREE.MeshLambertMaterial({color: 0xe0b10d}),
};

// set up lights
(function() {
  scene.add(new THREE.AmbientLight(0x222222));
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(10, 10, 30).normalize();
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}());

function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);
    self.clearTiles(); //for 3d rendering

    grid.cells.forEach(function (column) {
      column.forEach(function (column3d) {
        column3d.forEach(function (cell) {
          if (cell) {
            self.addTile(cell);
          }
        });
      });
    });
    animationStartTime = new Date();
    animate();

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }
  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.clearTiles = function () {
  // clear the 3D view
  scene.allObjects.forEach(function (object) {
    scene.remove(object);
  });
  scene.allObjcts = [];
};


// creating geometries for all numbers here so they don't get duplicated and use less memory
geometries = {
  '2' : new THREE.TextGeometry('2', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '4' : new THREE.TextGeometry('4', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '8' : new THREE.TextGeometry('8', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '16' : new THREE.TextGeometry('16', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '32' : new THREE.TextGeometry('32', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '64' : new THREE.TextGeometry('64', {font: 'helvetiker', weight: 'bold', size: 80, height:0.6}),
  '128' : new THREE.TextGeometry('128', {font: 'helvetiker', weight: 'bold', size: 60, height:0.6}),
  '256' : new THREE.TextGeometry('256', {font: 'helvetiker', weight: 'bold', size: 60, height:0.6}),
  '512' : new THREE.TextGeometry('512', {font: 'helvetiker', weight: 'bold', size: 60, height:0.6}),
  '1024' : new THREE.TextGeometry('1024', {font: 'helvetiker', weight: 'bold', size: 45, height:0.6}),
  '2048' : new THREE.TextGeometry('2048', {font: 'helvetiker', weight: 'bold', size: 45, height:0.6}),
};

cubeGeometries = {
  '2' : new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize),
  '4' : new THREE.CubeGeometry(cubeSize+2, cubeSize+2, cubeSize+2),
  '8' : new THREE.CubeGeometry(cubeSize+4, cubeSize+4, cubeSize+4),
  '16' : new THREE.CubeGeometry(cubeSize+6, cubeSize+6, cubeSize+6),
  '32' : new THREE.CubeGeometry(cubeSize+8, cubeSize+8, cubeSize+8),
  '64' : new THREE.CubeGeometry(cubeSize+10, cubeSize+10, cubeSize+10),
  '128' : new THREE.CubeGeometry(cubeSize+12, cubeSize+12, cubeSize+12),
  '256' : new THREE.CubeGeometry(cubeSize+14, cubeSize+14, cubeSize+14),
  '512' : new THREE.CubeGeometry(cubeSize+16, cubeSize+16, cubeSize+16),
  '1024' : new THREE.CubeGeometry(cubeSize+18, cubeSize+18, cubeSize+18),
  '2048' : new THREE.CubeGeometry(cubeSize+20, cubeSize+20, cubeSize+20),
};

tilesToProcess = [];

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var element = document.createElement("div");

  // 3d element
  el = new THREE.Object3D();
  el.add(new THREE.Mesh(cubeGeometries[tile.value], materials[tile.value]));
  // create mesh for number
  if (tile.value === 2 ) {
    text = new THREE.Mesh(geometries[tile.value], materials[4]);
  } else {
    text = new THREE.Mesh(geometries[tile.value], materials[2]);
  }

  // position number
  if (tile.value < 16) {
    text.position = {x: -40, y: -40, z: cubeSize/2+(Math.log(tile.value)/Math.log(2))};
  } else if (tile.value < 128) {
    text.position = {x: -60, y: -40, z: cubeSize/2+(Math.log(tile.value)/Math.log(2))};
  } else if (tile.value < 1024) {
    text.position = {x: -60, y: -40, z: cubeSize/2+(Math.log(tile.value)/Math.log(2))};
  } else {
    text.position = {x: -60, y: -2.50, z: cubeSize/2+(tile.value-2)/2};
  }

  if (tile.value === 2) {
    text.position = {x: -40, y: -40, z: cubeSize/2 + 0};
  } else if (tile.value === 4) {
    text.position = {x: -40, y: -40, z: cubeSize/2 + 1};
  } else if (tile.value === 8) {
    text.position = {x: -40, y: -40, z: cubeSize/2 + 2};
  } else if (tile.value === 16) {
    text.position = {x: -60, y: -40, z: cubeSize/2 + 3};
  } else if (tile.value === 32) {
    text.position = {x: -60, y: -40, z: cubeSize/2 + 4};
  } else if (tile.value === 64) {
    text.position = {x: -60, y: -40, z: cubeSize/2 + 5};
  } else if (tile.value === 128) {
    text.position = {x: -75, y: -30, z: cubeSize/2 + 6};
  } else if (tile.value === 256) {
    text.position = {x: -75, y: -30, z: cubeSize/2 + 7};
  } else if (tile.value === 512) {
    text.position = {x: -75, y: -30, z: cubeSize/2 + 8};
  } else if (tile.value === 1024) {
    text.position = {x: -75, y: -25, z: cubeSize/2 + 9};
  } else if (tile.value === 2048) {
    text.position = {x: -75, y: -25, z: cubeSize/2 + 10};
  }

  el.add(text);

  var position  = tile.previousPosition || { x: tile.x, y: tile.y, z: tile.z};
  positionClass = this.positionClass(position);
  el.position = {x: 400*(-1 + tile.x), y: 400*(1-tile.y), z: 400*(-1+tile.z)};
  scene.allObjects.push(el);

  tilesToProcess.push([el, tile.previousPosition, { x: tile.x, y: tile.y, z: tile.z}, tile.mergedFrom, tile.value]);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  if (tile.mergedFrom || !tile.previousPosition) {
    el.children[0].visible = false;
    el.children[1].visible = false;
  }

  // make the tiles move to their new position
  this.applyClasses(element, classes);
  scene.add(el);

  element.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y, z: tile.z });
      self.applyClasses(element, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(element, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(element, classes);
  }

  // Put the tile on the board
  this.tileContainer.appendChild(element);
  renderer.render(scene, camera);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1, z: position.z + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y + "-" + position.z;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-url", "http://git.io/JcE2GQ");
  tweet.setAttribute("data-counturl", "http://joppi.github.io/2048-3D/");
  tweet.textContent = "Tweet";

  var text = "I scored " + this.score + " points at 2048-3D, a game where you " +
             "join numbers to score high! #2048game3D";
  tweet.setAttribute("data-text", text);

  return tweet;
};

document.addEventListener(
  'mousemove',
  function(event) {
    mouseX = event.clientX - window.innerWidth/2;
    camera.position.x = -mouseX/1;
    mouseY = event.clientY - window.innerHeight/2;
    camera.position.y = mouseY/1;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    renderer.render(scene, camera);
    //window.requestAnimationFrame(function () {renderer.render(scene, camera)});
  },
  false
);

document.body.appendChild(renderer.domElement);

animate = function() {

  now = new Date();
  
  // this value goes from 0 to 1 during the animation
  r = (now - animationStartTime) / 500;

  if (r > 1) {
    // the animation has finished -> stop
    tilesToProcess.forEach( function(tile) {
      if (tile[1] !== null && !tile[3]) {
        // move tiles to their final position
        tile[0].position.x = 400*(-1 + tile[2].x);
        tile[0].position.y = -400*(-1 + tile[2].y);
        tile[0].position.z = 400*(-1 + tile[2].z);
      }
    });

    // make all cubes visible (including the new ones)
    scene.allObjects.forEach( function(obj) {
      obj.children[0].visible = true;
      obj.children[1].visible = true;
    });
    renderer.render(scene, camera);
    return;
  }
  tilesToProcess.forEach( function(tile) {
    if (tile[1] !== null && !tile[3]) {
      // move tile from its old position to its new position
      newx = 400*(-1 + tile[2].x);
      oldx = 400*(-1 + tile[1].x);
      tile[0].position.x = r * newx + (1-r) * oldx;
      newy = -400*(-1 + tile[2].y);
      oldy = -400*(-1 + tile[1].y);
      tile[0].position.y = r * newy + (1-r) * oldy;
      newz = 400*(-1 + tile[2].z);
      oldz = 400*(-1 + tile[1].z);
      tile[0].position.z = r * newz + (1-r) * oldz;
    }
  });

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
