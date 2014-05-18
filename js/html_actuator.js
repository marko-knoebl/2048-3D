
renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColorHex(0xccbbaa, 1);

camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 150;
scene = new THREE.Scene();

cube = new THREE.CubeGeometry(16, 16, 16);
var materials = {
  2: new THREE.MeshLambertMaterial({color: 0xffffff}),
  4: new THREE.MeshLambertMaterial({color: 0x888888}),
  8: new THREE.MeshLambertMaterial({color: 0xff9944}),
  16: new THREE.MeshLambertMaterial({color: 0xee8844}),
  32: new THREE.MeshLambertMaterial({color: 0xee6633}),
  64: new THREE.MeshLambertMaterial({color: 0xee4422}),
  128: new THREE.MeshLambertMaterial({color: 0xee4422}),
  256: new THREE.MeshLambertMaterial({color: 0xf65e3b}),
  512: new THREE.MeshLambertMaterial({color: 0xf65e3b}),
  1024: new THREE.MeshLambertMaterial({color: 0xf65e3b}),
  2048: new THREE.MeshLambertMaterial({color: 0xf65e3b}),
};

scene.allObjects = [];

var ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(10, 10, 30).normalize();
directionalLight.castShadow = true;
scene.add(directionalLight);

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
};


// creating geometries for all numbers here so they don't get duplicated and use less memory
geometries = {
  '2' : new THREE.TextGeometry('2', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '4' : new THREE.TextGeometry('4', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '8' : new THREE.TextGeometry('8', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '16' : new THREE.TextGeometry('16', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '32' : new THREE.TextGeometry('32', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '64' : new THREE.TextGeometry('64', {font: 'helvetiker', weight: 'bold', size: 8, height:1}),
  '128' : new THREE.TextGeometry('128', {font: 'helvetiker', weight: 'bold', size: 5, height:1}),
  '256' : new THREE.TextGeometry('256', {font: 'helvetiker', weight: 'bold', size: 5, height:1}),
  '512' : new THREE.TextGeometry('512', {font: 'helvetiker', weight: 'bold', size: 5, height:1}),
  '1024' : new THREE.TextGeometry('1024', {font: 'helvetiker', weight: 'bold', size: 4, height:1}),
  '2048' : new THREE.TextGeometry('2048', {font: 'helvetiker', weight: 'bold', size: 4, height:1}),
}

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var element = document.createElement("div");

  // 3d element
  el = new THREE.Object3D();
  el.add(new THREE.Mesh(cube, materials[tile.value]));

  // create mesh for number
  if (tile.value === 2 ) {
    text = new THREE.Mesh(geometries[tile.value], materials[4]);
  } else {
    text = new THREE.Mesh(geometries[tile.value], materials[2]);
  }

  // position number
  if (tile.value < 16) {
    text.position = {x: -4, y: -4, z: 7.5};
  } else if (tile.value < 128) {
    text.position = {x: -6, y: -4, z: 7.5};
  } else if (tile.value < 1024) {
    text.position = {x: -6, y: -4, z: 7.5};
  } else {
    text.position = {x: -6, y: -2.5, z: 7.5};
  }

  el.add(text);

  var position  = tile.previousPosition || { x: tile.x, y: tile.y, z: tile.z};
  positionClass = this.positionClass(position);
  el.position = {x: 40*(-1 + tile.x), y: 40*(1-tile.y), z: 40*(-1+tile.z)};
  scene.allObjects.push(el);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  // make the tiles move to their new position
  this.applyClasses(element, classes);
  scene.add(el);

  element.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y, z: tile.z });
      self.applyClasses(element, classes); // Update the position
      //element_.position = {x: 80*(-1 + tile.x), y: 80*(1-tile.y), z: 80*(-1+tile.z)};
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
  //scene.add(element_);
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
    camera.position.x = -mouseX/10;
    mouseY = event.clientY - window.innerHeight/2;
    camera.position.y = mouseY/10;
    renderer.render(scene, camera);
    //window.requestAnimationFrame(function () {renderer.render(scene, camera)});
  },
  false
)

document.body.appendChild(renderer.domElement);
