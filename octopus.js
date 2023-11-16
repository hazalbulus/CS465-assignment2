// create initial constants

initialParameters = {
  x: 0,
  y: 1,
  z: 0,
  xLength: 1.5,
  yLength: 1.5,
  zLength: 1.5,
  xRotation: 0,
  yRotation: 0,
  zRotation: 0,
};

initialLegRotations = {
  root: [90, 0, 90],
  "leg-1-1": [90, 0, 0],
  "leg-2-1": [90, 0, 0],
  "leg-3-1": [90, 0, 0],
  "leg-4-1": [90, 0, 0],
  "leg-5-1": [90, 0, 0],
  "leg-6-1": [90, 0, 0],
  "leg-7-1": [90, 0, 0],
  "leg-8-1": [90, 0, 0],

  "leg-1-2": [0, 0, 0],
  "leg-2-2": [0, 0, 0],
  "leg-3-2": [0, 0, 0],
  "leg-4-2": [0, 0, 0],
  "leg-5-2": [0, 0, 0],
  "leg-6-2": [0, 0, 0],
  "leg-7-2": [0, 0, 0],
  "leg-8-2": [0, 0, 0],

  "leg-1-3": [0, 0, 0],
  "leg-2-3": [0, 0, 0],
  "leg-3-3": [0, 0, 0],
  "leg-4-3": [0, 0, 0],
  "leg-5-3": [0, 0, 0],
  "leg-6-3": [0, 0, 0],
  "leg-7-3": [0, 0, 0],
  "leg-8-3": [0, 0, 0],
};

// create global variables

var modelViewMatrix, projectionMatrix;

var modelViewMatrixLoc;

var vBuffer, nBuffer;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.5, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.2, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 50.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var tree;

var stack = [];

var rotation_direction = 0;

// Node class to represent any object drawn to canvas
class Node {
  constructor(name, parent, parameters, drawFunction) {
    this.name = name;
    this.parent = parent;
    this.children = [];
    this.vertices = [];
    this.normals = [];
    this.rotations = [0, 0, 0];
    this.translate = [0, 0, 0];
    this.parameters = parameters;
    this.render = drawFunction;
    this.centerTranslate = [0, 0, 0];
  }

  addChild(child) {
    this.children.push(child);
  }

  getChildren() {
    return this.childrens;
  }
}

// Tree class to implement a 3-D hierarchical model
class Tree {
  constructor(root) {
    this.root = root;
    this.nodes = {};
    this.nodes["root"] = root;
  }

  addNode(node) {
    this.nodes[node.name] = node;
  }

  updateTransformToSubtree(node, f) {
    if (node == null) {
      return;
    }

    f(node);

    node.children.forEach((child, index) => {
      this.updateTransformToSubtree(child, f);
    });
  }

  updateCurrentPostureString(node) {
    if (node == null) return;
    for (var i = 0; i < 3; i++)
      currentPostureString +=
        node.name + " " + i + " " + node.rotations[i] + ",";
    node.children.forEach((child, index) => {
      this.updateCurrentPostureString(child);
    });
  }

  resetPosture(node) {
    if (node == null) return;
    for (var i = 0; i < 3; i++) node.rotations[i] = 0;
    node.children.forEach((child, index) => {
      this.resetPosture(child);
    });
  }

  traverseAndRender(node, currentModelViewMatrix) {
    if (node == null) return;

    currentModelViewMatrix = mult(currentModelViewMatrix, node.transform);
    modelViewMatrix = currentModelViewMatrix;
    node.render(node);

    node.children.forEach((child, index) => {
      this.traverseAndRender(child, currentModelViewMatrix);
    });
  }
}

// main function to initiate program
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");

  gl.useProgram(program);

  initModel();
  var danceCheckbox = document.getElementById("dance");
  var swimCheckbox = document.getElementById("swim");

  danceCheckbox.addEventListener("change", function () {
    if (this.checked) {
      swimCheckbox.checked = false;
    }
  });

  swimCheckbox.addEventListener("change", function () {
    if (this.checked) {
      danceCheckbox.checked = false;
    }
  });
  var load_button = document.getElementById("load_button");
  load_button.addEventListener("click", function () {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      load_button.addEventListener("change", function () {
        let myFile = load_button.files[0];
        let fileReader = new FileReader();
        fileReader.onload = function () {
          let result = JSON.parse(fileReader.result);

          allPostures = result[0];

          animationCounter = 0;
          flag = 1;
        };

        fileReader.readAsText(myFile);
      });
    } else {
      alert("File System is not supported in this browser");
    }
  });

  // Load shaders and use the resulting shader program

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  sliderInit();

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

  projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  render();
};

// initialization of the vertices and the normals of the 3d octopus model
function initModel() {
  var rootNode = new Node(
    "root",
    null,
    initialParameters,
    drawRectangularPrism
  );
  createRectangularPrism(rootNode); // Create the head of the octopus
  tree = new Tree(rootNode);

  // Calculate corner and midpoint positions for the tentacles
  var baseHeight = -rootNode.parameters.yLength / 2; // Assume the head is centered at the origin
  var cornerPositions = [
    vec3(
      (-rootNode.parameters.xLength * 7) / 8,
      baseHeight / 2,
      (rootNode.parameters.zLength * 7) / 8
    ), // Front-left
    vec3(
      (rootNode.parameters.xLength * 7) / 8,
      baseHeight / 2,
      (rootNode.parameters.zLength * 7) / 8
    ), // Front-right
    vec3(
      (rootNode.parameters.xLength * 7) / 8,
      baseHeight / 2,
      (-rootNode.parameters.zLength * 7) / 8
    ), // Back-right
    vec3(
      (-rootNode.parameters.xLength * 7) / 8,
      baseHeight / 2,
      (-rootNode.parameters.zLength * 7) / 8
    ), // Back-left
  ];
  var midpointPositions = [
    vec3(0, baseHeight / 2, (rootNode.parameters.zLength * 7) / 8), // Front-center
    vec3((rootNode.parameters.xLength * 7) / 8, baseHeight / 2, 0), // Right-center
    vec3(0, baseHeight / 2, (-rootNode.parameters.zLength * 7) / 8), // Back-center
    vec3((-rootNode.parameters.xLength * 7) / 8, baseHeight / 2, 0), // Left-center
  ];

  // Create and position tentacles at corners
  for (var i = 0; i < 4; i++) {
    var cornerLeg = createLeg(i + 1, rootNode, cornerPositions[i]);
    rootNode.addChild(cornerLeg);
  }

  // Create and position tentacles at midpoints
  for (var i = 0; i < 4; i++) {
    var midpointLeg = createLeg(i + 5, rootNode, midpointPositions[i]);
    rootNode.addChild(midpointLeg);
  }
}

// function to create leg models
function createLeg(legNumber, parent, position) {
  var legBaseParameters = {
    x: position[0],
    y: position[1],
    z: position[2],
    xLength: parent.parameters.xLength / 4,
    yLength: parent.parameters.yLength / 4,
    zLength: parent.parameters.zLength * 2,
    xRotation: initialLegRotations["leg-" + legNumber + "-1"][0],
    yRotation: initialLegRotations["leg-" + legNumber + "-1"][1],
    zRotation: initialLegRotations["leg-" + legNumber + "-1"][2],
  };

  var legPart1 = new Node(
    "leg-" + legNumber + "-1",
    parent,
    legBaseParameters,
    drawCylinder
  );
  createCylinder(legPart1);
  legPart1.centerTranslate = [0, 0, -legPart1.parameters.zLength / 4];
  tree.addNode(legPart1);

  var legPart2Parameters = {
    x: legPart1.parameters.x,
    y: legPart1.parameters.y,
    z: legPart1.parameters.z + legPart1.parameters.zLength / 2,
    xLength: legBaseParameters.xLength * 0.8,
    yLength: legBaseParameters.yLength * 0.8,
    zLength: legBaseParameters.zLength * 1.5,
    xRotation: initialLegRotations["leg-" + legNumber + "-2"][0],
    yRotation: initialLegRotations["leg-" + legNumber + "-2"][1],
    zRotation: initialLegRotations["leg-" + legNumber + "-2"][2],
  };

  var legPart2 = new Node(
    "leg-" + legNumber + "-2",
    legPart1,
    legPart2Parameters,
    drawCylinder
  );
  createCylinder(legPart2);
  legPart2.centerTranslate = [0, 0, -legPart2.parameters.zLength / 4];
  tree.addNode(legPart2);
  legPart1.addChild(legPart2);

  var legPart3Parameters = {
    x: legPart2.parameters.x,
    y: legPart2.parameters.y,
    z: legPart2.parameters.z + legPart2.parameters.zLength / 2,
    xLength: legPart2Parameters.xLength * 0.8,
    yLength: legPart2Parameters.yLength * 0.8,
    zLength: legPart2Parameters.zLength * 0.8,
    xRotation: initialLegRotations["leg-" + legNumber + "-3"][0],
    yRotation: initialLegRotations["leg-" + legNumber + "-3"][1],
    zRotation: initialLegRotations["leg-" + legNumber + "-3"][2],
  };

  var legPart3 = new Node(
    "leg-" + legNumber + "-3",
    legPart2,
    legPart3Parameters,
    drawCylinder
  );
  createCylinder(legPart3);
  legPart3.centerTranslate = [0, 0, -legPart3.parameters.zLength / 4];
  tree.addNode(legPart3);
  legPart2.addChild(legPart3);

  return legPart1;
}

// function to create surface
function createSurfaceForOctopus(parent) {
  surfaceParameter = {
    x: tree.nodes["root"].parameters["x"] - 5,
    y: tree.nodes["root"].parameters["y"] - 5,
    z: tree.nodes["root"].parameters["z"] - 2,
    xLength: 50,
    yLength: 50,
    zLength: 2,
    xRotation: 0,
    yRotation: 0,
    zRotation: 0,
  };

  var surface = new Node("surface", parent, surfaceParameter, drawSurface);
  tree.addNode(surface);
  createSurface(surface);

  return surface;
}

var flag = 0;
// function to constantly call re-rendering for canvas
var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clearColor(1, 0.2, 1, 0.7);

  // hierarchically apply transform to all nodes
  tree.updateTransformToSubtree(tree.root, applyTransform);

  // hierarchically render all nodes
  modelViewMatrix = mat4();
  tree.traverseAndRender(tree.root, modelViewMatrix);

  // if dance checkbox checked run dance if flag is true run loaded postures
  if (document.getElementById("dance").checked)
    renderAnimation(default_animString);
  else if (document.getElementById("swim").checked)
    renderAnimation(swim_animString);
  else if (flag) {
    renderAnimation(allPostures);
  }

  requestAnimFrame(render);
};

// applies transform to the given node according to the node's parameters
function applyTransform(node) {
  node.transform = mat4();
  node.transform = mult(
    node.transform,
    translate(node.translate[0], node.translate[1], node.translate[2])
  );

  if (node.parent)
    node.transform = mult(
      node.transform,
      translate(
        node.parameters["x"] + node.parent.centerTranslate[0],
        node.parameters["y"] + node.parent.centerTranslate[1],
        node.parameters["z"] + node.parent.centerTranslate[2]
      )
    );
  else
    node.transform = mult(
      node.transform,
      translate(
        node.parameters["x"],
        node.parameters["y"],
        node.parameters["z"]
      )
    );

  node.transform = mult(
    node.transform,
    rotate(node.parameters["xRotation"] + node.rotations[0], 1, 0, 0)
  );
  node.transform = mult(
    node.transform,
    rotate(node.parameters["yRotation"] + node.rotations[1], 0, 1, 0)
  );
  node.transform = mult(
    node.transform,
    rotate(node.parameters["zRotation"] + node.rotations[2], 0, 0, 1)
  );

  node.transform = mult(
    node.transform,
    translate(
      -node.parameters["x"] - node.centerTranslate[0],
      -node.parameters["y"] - node.centerTranslate[1],
      -node.parameters["z"] - node.centerTranslate[2]
    )
  );
}

// draws the given vertices and normals according to the given drawing type by using GPU buffers
function draw(type, vertices, normals) {
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);
  gl.drawArrays(type, 0, vertices.length);
}

// draws the given node as a cylinder
function drawCylinder(node) {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(node.parameters.x, node.parameters.y, node.parameters.z)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(
      node.parameters.xLength,
      node.parameters.yLength,
      node.parameters.zLength
    )
  );

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  draw(gl.TRIANGLE_FAN, node.vertices[0], node.normals[0]);
  draw(gl.TRIANGLE_FAN, node.vertices[1], node.normals[1]);
  draw(gl.TRIANGLE_STRIP, node.vertices[2], node.normals[2]);
}

// draws the given node as a sphere
function drawSphere(node) {
  instanceMatrix = mult(
    modelViewMatrix,
    rotate(node.parameters["xRotation"], 1, 0, 0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    rotate(node.parameters["yRotation"], 0, 1, 0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    rotate(node.parameters["zRotation"], 0, 0, 1)
  );

  instanceMatrix = mult(
    modelViewMatrix,
    translate(node.parameters.x, node.parameters.y, node.parameters.z)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(
      node.parameters.xLength,
      node.parameters.yLength,
      node.parameters.zLength
    )
  );

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  draw(gl.TRIANGLES, node.vertices, node.normals);
}

// draws the surface
function drawSurface(node) {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(node.parameters.x, node.parameters.y, node.parameters.z)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(
      node.parameters.xLength,
      node.parameters.yLength,
      node.parameters.zLength
    )
  );

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
  draw(gl.TRIANGLE_FAN, node.vertices, node.normals);
}

function drawRectangularPrism(node) {
  instanceMatrix = mult(
    modelViewMatrix,
    translate(node.parameters.x, node.parameters.y, node.parameters.z)
  );
  instanceMatrix = mult(
    instanceMatrix,
    rotate(node.parameters["xRotation"], 1, 0, 0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    rotate(node.parameters["yRotation"], 0, 1, 0)
  );
  instanceMatrix = mult(
    instanceMatrix,
    rotate(node.parameters["zRotation"], 0, 0, 1)
  );
  instanceMatrix = mult(
    instanceMatrix,
    scale4(
      node.parameters.xLength,
      node.parameters.yLength,
      node.parameters.zLength
    )
  );

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(node.vertices), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(node.normals), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  gl.drawArrays(gl.TRIANGLES, 0, node.vertices.length);
}

function createRectangularPrism(node) {
  // Define the vertices for the prism (8 unique corners)
  var vertices = [
    vec4(-1, -1, 1, 1.0), // Front-bottom-left 0
    vec4(1, -1, 1, 1.0), // Front-bottom-right 1
    vec4(1, 1, 1, 1.0), // Front-top-right 2
    vec4(-1, 1, 1, 1.0), // Front-top-left 3
    vec4(-1, -1, -1, 1.0), // Back-bottom-left 4
    vec4(1, -1, -1, 1.0), // Back-bottom-right 5
    vec4(1, 1, -1, 1.0), // Back-top-right 6
    vec4(-1, 1, -1, 1.0), // Back-top-left 7
  ];

  // Define the vertex indices for the triangles that make up each face
  var indices = [
    // Front face
    0, 1, 2, 0, 2, 3,
    // Back face
    4, 6, 5, 4, 7, 6,
    // Top face
    3, 2, 6, 3, 6, 7,
    // Bottom face
    4, 5, 1, 4, 1, 0,
    // Right face
    1, 5, 6, 1, 6, 2,
    // Left face
    4, 0, 3, 4, 3, 7,
  ];

  // Use the indices to add vertices in the correct order
  var prismVertices = [];
  for (var i = 0; i < indices.length; i++) {
    prismVertices.push(vertices[indices[i]]);
  }

  // Calculate normals for each vertex
  var normals = calculateNormals(prismVertices);

  // Assign vertices and normals to the node
  node.vertices = prismVertices;
  node.normals = normals;
}

// Helper function to calculate normals for a given set of vertices
function calculateNormals(vertices) {
  var normals = [];

  // Calculate normals for each triangle
  for (var i = 0; i < vertices.length; i += 3) {
    var p0 = vertices[i];
    var p1 = vertices[i + 1];
    var p2 = vertices[i + 2];

    // Calculate vectors for two edges of the triangle
    var edge1 = subtract(p1, p0);
    var edge2 = subtract(p2, p0);

    // Use the cross product to get the face normal
    var normal = normalize(cross(edge1, edge2));
    normal = vec4(normal);

    // Apply the same normal to all three vertices of the triangle
    normals.push(normal, normal, normal);
  }

  return normals;
}

// Helper functions to perform vector subtraction and cross product
function subtract(v1, v2) {
  return vec3(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]);
}

function cross(v1, v2) {
  return vec3(
    v1[1] * v2[2] - v1[2] * v2[1],
    v1[2] * v2[0] - v1[0] * v2[2],
    v1[0] * v2[1] - v1[1] * v2[0]
  );
}

// Helper function to normalize a vector
function normalize(v) {
  var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return vec3(v[0] / len, v[1] / len, v[2] / len);
}

// creates a generic sphere and gives the vertices and the normals to the node
function createSphere(node) {
  let latitudeBands = 30;
  let longitudeBands = 30;
  let radius = 1.25;
  let sphereVertexPosition = [];
  var newShpere = [];
  var newShepereNormals = [];

  // Calculate sphere vertex positions, normals, and texture coordinates.
  for (let latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
    let theta = (latNumber * Math.PI) / latitudeBands;
    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);

    for (let longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
      let phi = (longNumber * 2 * Math.PI) / longitudeBands;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      let x = cosPhi * sinTheta * radius;
      let y = cosTheta * radius;
      let z = sinPhi * sinTheta * radius;

      sphereVertexPosition.push(vec4(x, y, z, 1.0));
    }
  }

  // Calculate sphere indices.
  for (let latNumber = 0; latNumber < latitudeBands; ++latNumber) {
    for (let longNumber = 0; longNumber < longitudeBands; ++longNumber) {
      let first = latNumber * (longitudeBands + 1) + longNumber;
      let second = first + longitudeBands + 1;

      newShpere.push(sphereVertexPosition[first]);
      newShpere.push(sphereVertexPosition[second]);
      newShpere.push(sphereVertexPosition[first + 1]);

      newShpere.push(sphereVertexPosition[second]);
      newShpere.push(sphereVertexPosition[second + 1]);
      newShpere.push(sphereVertexPosition[first + 1]);

      newShepereNormals.push(
        sphereVertexPosition[first][0],
        sphereVertexPosition[first][1],
        sphereVertexPosition[first][2],
        0
      );
      newShepereNormals.push(
        sphereVertexPosition[second][0],
        sphereVertexPosition[second][1],
        sphereVertexPosition[second][2],
        0
      );
      newShepereNormals.push(
        sphereVertexPosition[first + 1][0],
        sphereVertexPosition[first + 1][1],
        sphereVertexPosition[first + 1][2],
        0
      );

      newShepereNormals.push(
        sphereVertexPosition[second][0],
        sphereVertexPosition[second][1],
        sphereVertexPosition[second][2],
        0
      );
      newShepereNormals.push(
        sphereVertexPosition[second + 1][0],
        sphereVertexPosition[second + 1][1],
        sphereVertexPosition[second + 1][2],
        0
      );
      newShepereNormals.push(
        sphereVertexPosition[first + 1][0],
        sphereVertexPosition[first + 1][1],
        sphereVertexPosition[first + 1][2],
        0
      );
    }
  }

  node.vertices = newShpere;
  node.normals = newShepereNormals;
  node.rotations = [0, 0, 0];
}

// creates a generic cylinder and gives the vertices and the normals to the node
function createCylinder(node) {
  node.vertices = [[], [], []];
  node.normals = [[], [], []];

  let longitudeBands = 32;
  for (let i = 0; i < longitudeBands; i++) {
    let x = Math.cos(((2 * Math.PI) / longitudeBands) * i);
    let y = Math.sin(((2 * Math.PI) / longitudeBands) * i);
    let z = 0.5;
    node.vertices[0].push(vec4(x / 2, y / 2, z / 2, 1.0));
    node.normals[0].push(x / 2, y / 2, z / 2, 0);
    node.vertices[1].push(vec4(x / 2, y / 2, -z / 2, 1.0));
    node.normals[1].push(x / 2, y / 2, -z / 2, 0);
  }

  for (let i = 0; i < longitudeBands; i++) {
    node.vertices[2].push(node.vertices[0][i]);
    node.normals[2].push(
      node.vertices[0][i][0],
      node.vertices[0][i][1],
      node.vertices[0][i][2],
      0
    );
    node.vertices[2].push(node.vertices[1][i]);
    node.normals[2].push(
      node.vertices[1][i][0],
      node.vertices[1][i][1],
      node.vertices[1][i][2],
      0
    );
  }
  node.vertices[2].push(node.vertices[0][0]);
  node.normals[2].push(
    node.vertices[0][0][0],
    node.vertices[0][0][1],
    node.vertices[0][0][2],
    0
  );
  node.vertices[2].push(node.vertices[1][0]);
  node.normals[2].push(
    node.vertices[1][0][0],
    node.vertices[1][0][1],
    node.vertices[1][0][2],
    0
  );
}

// creates a generic surface and gives the vertices and the normals to the node
function createSurface(node) {
  node.vertices = [];

  var longitudeBands = 32;
  for (let i = 0; i < longitudeBands; i++) {
    let x = Math.cos(((2 * Math.PI) / longitudeBands) * i);
    let y = Math.sin(((2 * Math.PI) / longitudeBands) * i);
    let z = 0.5;
    node.vertices.push(vec4(x / 2, y / 2, z / 2, 1.0));
    node.normals.push(x / 2, y / 2, z / 2, 0);
  }
}

// create animation parameters
var fps = 60;
var time_limit = 75;
var ready = true;
var animationCounter = 0;

// create dance animation for presentation
var default_animString =
  "root 2 20 " +
  "leg-6-1 0 -20,leg-6-1 1 20,leg-6-2 1 -40,leg-6-3 0 -25,leg-6-3 1 -20," +
  "leg-2-1 0 -20,leg-2-1 1 -20,leg-2-2 1 40,leg-2-3 0 -25,leg-2-3 1 20," +
  "leg-4-1 0 -5,leg-4-2 0 -10,leg-4-3 0 -40,leg-4-3 1 -30," +
  "leg-8-1 0 -5,leg-8-2 0 -10,leg-8-3 0 -40,leg-8-3 1 30," +
  "leg-1-1 0 0,leg-1-2 0 0,leg-1-3 0 0," +
  "leg-5-1 0 0,leg-5-2 0 0,leg-5-3 0 0," +
  "leg-3-1 0 0,leg-3-2 0 0,leg-3-3 0 0,leg-3-3 1 0," +
  "leg-7-1 0 0,leg-7-2 0 0,leg-7-3 0 0,leg-7-3 1 0\n" +
  "root 0 -40 " +
  "leg-6-1 0 0,leg-6-1 1 0,leg-6-2 1 0,leg-6-3 0 0,leg-6-3 1 0," +
  "leg-2-1 0 0,leg-2-1 1 0,leg-2-2 1 0,leg-2-3 0 0,leg-2-3 1 0," +
  "leg-4-1 0 0,leg-4-2 0 0,leg-4-3 0 0,leg-4-3 1 0," +
  "leg-8-1 0 0,leg-8-2 0 0,leg-8-3 0 0,leg-8-3 1 0," +
  "leg-1-1 0 5,leg-1-2 0 -20,leg-1-3 0 40," +
  "leg-5-1 0 5,leg-5-2 0 -20,leg-5-3 0 40," +
  "leg-3-1 0 40,leg-3-2 0 -10,leg-3-3 0 -40,leg-3-3 1 -20," +
  "leg-7-1 0 40,leg-7-2 0 -10,leg-7-3 0 -40,leg-7-3 1 20," +
  "root 2 0";

// create swim animation
var swim_animString =
  // Move legs upwards
  "root 1 10 " +
  "leg-1-1 0 -25,leg-1-2 0 -50 -10,leg-1-3 0 -75," + // Front-left leg
  "leg-1-1 1 -25,leg-1-2 1 -50 -10,leg-1-3 1 -75," + // Front-left leg
  "leg-1-1 2 -25,leg-1-2 2 -50 -10,leg-1-3 2 -75," + // Front-left leg

  "leg-2-1 0 -25,leg-2-2 0 -50,leg-2-3 0 -75," + // Front-right leg
  "leg-2-1 1 25,leg-2-2 1 50,leg-2-3 1 75," + // Front-right leg
  "leg-2-1 2 25,leg-2-2 2 50,leg-2-3 2 75," + // Front-right leg

  "leg-3-1 0 25,leg-3-2 0 50,leg-3-3 0 75," + // Back-right leg
  "leg-3-1 1 25,leg-3-2 1 50,leg-3-3 1 75," + // Back-right leg
  "leg-3-1 2 25,leg-3-2 2 50,leg-3-3 2 75," + // Back-right leg

  "leg-4-1 0 25,leg-4-2 0 50,leg-4-3 0 75," + // Back-left leg
  "leg-4-1 1 -25,leg-4-2 1 -25,leg-4-3 1 -75," + // Back-left leg
  "leg-4-1 2 -25,leg-4-2 2 -25,leg-4-3 2 -75," + // Back-left leg

  "leg-5-1 0 -25,leg-5-2 0 -50,leg-5-3 0 -75," + // Mid-front-left leg

  "leg-6-1 1 25,leg-6-2 1 50,leg-6-3 1 75," + // Mid-front-right leg

  "leg-7-1 0 25,leg-7-2 0 50,leg-7-3 0 75," + // Mid-back-right leg

  "leg-8-1 1 -25,leg-8-2 1 -50,leg-8-3 1 -75\n" + // Mid-back-left leg


  // Move legs downwards
  "root 1 -10 " +

  "leg-1-1 0 10,leg-1-2 0 10,leg-1-3 0 10," + // Front-left leg
  "leg-1-1 1 10,leg-1-2 1 10,leg-1-3 1 10," + // Front-left leg
  "leg-1-1 2 10,leg-1-2 2 10,leg-1-3 2 10," + // Front-left leg

  "leg-2-1 0 10,leg-2-2 0 10,leg-2-3 0 10," + // Front-right leg
  "leg-2-1 1 -10,leg-2-2 1 -10,leg-2-3 1 -10," + // Front-right leg
  "leg-2-1 2 -10,leg-2-2 -2 -10,leg-2-3 2 -10," + // Front-right leg

  "leg-3-1 0 -10,leg-3-2 0 -10,leg-3-3 0 -10," + // Back-right leg
  "leg-3-1 1 -10,leg-3-2 1 -10,leg-3-3 1 -10," + // Back-right leg
  "leg-3-1 2 -10,leg-3-2 2 -10,leg-3-3 2 -10," + // Back-right leg

  "leg-4-1 0 -10,leg-4-2 0 -10,leg-4-3 0 -10," + // Back-left leg
  "leg-4-1 1 10,leg-4-2 1 10,leg-4-3 1 10," + // Back-left leg
  "leg-4-1 2 10,leg-4-2 2 10,leg-4-3 2 10," + // Back-left leg

  "leg-5-1 0 10,leg-5-2 0 10,leg-5-3 0 10," + // Mid-front-left leg

  "leg-6-1 1 -10,leg-6-2 1 -10,leg-6-3 1 -10," + // Mid-front-right leg

  "leg-7-1 0 -10,leg-7-2 0 -10,leg-7-3 0 -10," + // Mid-back-right leg

  "leg-8-1 1 10,leg-8-2 1 10,leg-8-3 1 10"; // Mid-back-left leg

  "root 2 0";

// render function for creating animation effect
function renderAnimation(animString) {
  var animFile = animString.split("\n");

  if (ready == true) {
    generateAnimationString(animFile[animationCounter]);

    animationCounter++;

    // Reset the animationCounter based on the active animation type
    if (animationCounter > animFile.length - 1) {
      if (document.getElementById("repeat").checked) {
        animationCounter = 0;
      } else if (document.getElementById("dance").checked) {
        animationCounter = 0;
        animString = default_animString; // Reset to dance animation
      } else if (document.getElementById("swim").checked) {
        animationCounter = 0;
        animString = swim_animString; // Change to swim animation
      }
    }
  }
}

// convert given string to animation string so that octopus's parts can be modified according to given angles and direction
function generateAnimationString(animLine) {
  if (animLine != undefined) {
    ready = false; //block the animation calls
    var fullAnimationCommand = ""; //full animation command that is to be used by the keyframe animator

    var animCommands = animLine.split(","); //split multiple animation requests to process them one by one

    for (var j = 0; j < fps; j++) {
      //divide the animation into fps pieces for smooth and interpolated motion

      for (var i = 0; i < animCommands.length; i++) {
        var command = animCommands[i].split(" ");
        var partName = command[0];
        var moveDirection = parseFloat(command[1]);
        var angle = parseFloat(command[2]);
        if (tree.nodes[partName] != undefined) {
          var total_move =
            angle - tree.nodes[partName].rotations[moveDirection];
          var partialMove = total_move / fps;

          fullAnimationCommand +=
            partName + " " + moveDirection + " " + partialMove + ",";
        }
      }

      fullAnimationCommand = fullAnimationCommand.substring(
        0,
        fullAnimationCommand.length - 1
      ); //delete the last comma

      fullAnimationCommand += "\n";
    }
    runAnimation(fullAnimationCommand);
  }
}

// according to given animationCommand, it applys given degrees to given parts.
function runAnimation(animationCommand) {
  var j = 0;

  var animationList = animationCommand.split("\n");

  function animate() {
    setTimeout(function () {
      var commands = animationList[j].split(",");

      for (var k = 0; k < commands.length; k++) {
        var command = commands[k].split(" ");

        var executionBodyPart = command[0];
        var executionDirection = parseFloat(command[1]);
        var executionAngle = parseFloat(command[2]);
        if (tree.nodes[executionBodyPart] != undefined)
          tree.nodes[executionBodyPart].rotations[executionDirection] +=
            executionAngle;
      }

      j++;

      if (j < animationList.length) animate();
      else ready = true;
    }, 1000 / time_limit);
  }

  animate();
}

var allPostures = "";
var currentPostureString = "";
// creates a current posture string and appends it to allPostures string
function saveCurrentPosture() {
  currentPostureString = "";
  tree.updateCurrentPostureString(tree.root);
  allPostures += currentPostureString + "\n";
}

// cleans allPostures string
function resetSavedPostures() {
  allPostures = "";
}

// stops loaded animation
function stopAnimation() {
  flag = 0;
}

// starts loaded animation
function startAnimation() {
  flag = 1;
}

function resetPosture() {
  flag = 0;
  tree.resetPosture(tree.root);
}

// create a save file which is stores allPostures
function saveAnimationString() {
  var data = [];

  data[0] = allPostures;

  var write_element = document.createElement("a");
  write_element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
  );
  write_element.setAttribute("download", "OctopusAnimation.txt");

  write_element.style.display = "none";
  document.body.appendChild(write_element);
  write_element.click();
  document.body.removeChild(write_element);
}

// inits all sliders
function sliderInit() {
  document.getElementById("slider1").oninput = function () {
    tree.nodes["root"].rotations[0] = parseFloat(
      document.getElementById("slider1").value
    );
    document.getElementById("slider1-value").innerHTML =
      document.getElementById("slider1").value;
  };
  document.getElementById("slider2").oninput = function () {
    tree.nodes["root"].rotations[1] = parseFloat(
      document.getElementById("slider2").value
    );
    document.getElementById("slider2-value").innerHTML =
      document.getElementById("slider2").value;
  };
  document.getElementById("slider3").oninput = function () {
    tree.nodes["root"].rotations[2] = parseFloat(
      document.getElementById("slider3").value
    );
    document.getElementById("slider3-value").innerHTML =
      document.getElementById("slider3").value;
  };
  document.getElementById("slider4").oninput = function () {
    tree.nodes["leg-4-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider4").value
    );
    document.getElementById("slider4-value").innerHTML =
      document.getElementById("slider4").value;
  };
  document.getElementById("slider5").oninput = function () {
    tree.nodes["leg-4-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider5").value
    );
    document.getElementById("slider5-value").innerHTML =
      document.getElementById("slider5").value;
  };
  document.getElementById("slider6").oninput = function () {
    tree.nodes["leg-4-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider6").value
    );
    document.getElementById("slider6-value").innerHTML =
      document.getElementById("slider6").value;
  };
  document.getElementById("slider7").oninput = function () {
    tree.nodes["leg-8-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider7").value
    );
    document.getElementById("slider7-value").innerHTML =
      document.getElementById("slider7").value;
  };
  document.getElementById("slider8").oninput = function () {
    tree.nodes["leg-8-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider8").value
    );
    document.getElementById("slider8-value").innerHTML =
      document.getElementById("slider8").value;
  };
  document.getElementById("slider9").oninput = function () {
    tree.nodes["leg-8-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider9").value
    );
    document.getElementById("slider9-value").innerHTML =
      document.getElementById("slider9").value;
  };
  document.getElementById("slider10").oninput = function () {
    tree.nodes["leg-1-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider10").value
    );
    document.getElementById("slider10-value").innerHTML =
      document.getElementById("slider10").value;
  };
  document.getElementById("slider11").oninput = function () {
    tree.nodes["leg-1-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider11").value
    );
    document.getElementById("slider11-value").innerHTML =
      document.getElementById("slider11").value;
  };
  document.getElementById("slider12").oninput = function () {
    tree.nodes["leg-1-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider12").value
    );
    document.getElementById("slider12-value").innerHTML =
      document.getElementById("slider12").value;
  };
  document.getElementById("slider13").oninput = function () {
    tree.nodes["leg-5-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider13").value
    );
    document.getElementById("slider13-value").innerHTML =
      document.getElementById("slider13").value;
  };
  document.getElementById("slider14").oninput = function () {
    tree.nodes["leg-5-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider14").value
    );
    document.getElementById("slider14-value").innerHTML =
      document.getElementById("slider14").value;
  };
  document.getElementById("slider15").oninput = function () {
    tree.nodes["leg-5-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider15").value
    );
    document.getElementById("slider15-value").innerHTML =
      document.getElementById("slider15").value;
  };
  document.getElementById("slider16").oninput = function () {
    tree.nodes["leg-3-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider16").value
    );
    document.getElementById("slider16-value").innerHTML =
      document.getElementById("slider16").value;
  };
  document.getElementById("slider17").oninput = function () {
    tree.nodes["leg-3-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider17").value
    );
    document.getElementById("slider17-value").innerHTML =
      document.getElementById("slider17").value;
  };
  document.getElementById("slider18").oninput = function () {
    tree.nodes["leg-3-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider18").value
    );
    document.getElementById("slider18-value").innerHTML =
      document.getElementById("slider18").value;
  };
  document.getElementById("slider19").oninput = function () {
    tree.nodes["leg-7-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider19").value
    );
    document.getElementById("slider19-value").innerHTML =
      document.getElementById("slider19").value;
  };
  document.getElementById("slider20").oninput = function () {
    tree.nodes["leg-7-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider20").value
    );
    document.getElementById("slider20-value").innerHTML =
      document.getElementById("slider20").value;
  };
  document.getElementById("slider21").oninput = function () {
    tree.nodes["leg-7-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider21").value
    );
    document.getElementById("slider21-value").innerHTML =
      document.getElementById("slider21").value;
  };
  document.getElementById("slider22").oninput = function () {
    tree.nodes["leg-2-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider22").value
    );
    document.getElementById("slider22-value").innerHTML =
      document.getElementById("slider22").value;
  };
  document.getElementById("slider23").oninput = function () {
    tree.nodes["leg-2-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider23").value
    );
    document.getElementById("slider23-value").innerHTML =
      document.getElementById("slider23").value;
  };
  document.getElementById("slider24").oninput = function () {
    tree.nodes["leg-2-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider24").value
    );
    document.getElementById("slider24-value").innerHTML =
      document.getElementById("slider24").value;
  };
  document.getElementById("slider25").oninput = function () {
    tree.nodes["leg-6-1"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider25").value
    );
    document.getElementById("slider25-value").innerHTML =
      document.getElementById("slider25").value;
  };
  document.getElementById("slider26").oninput = function () {
    tree.nodes["leg-6-2"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider26").value
    );
    document.getElementById("slider26-value").innerHTML =
      document.getElementById("slider26").value;
  };

  document.getElementById("slider27").oninput = function () {
    tree.nodes["leg-6-3"].rotations[rotation_direction] = parseFloat(
      document.getElementById("slider27").value
    );
    document.getElementById("slider27-value").innerHTML =
      document.getElementById("slider27").value;
  };
}

function scale4(a, b, c) {
  var result = mat4();
  result[0][0] = a;
  result[1][1] = b;
  result[2][2] = c;
  return result;
}

function onDirectionChange(value) {
  rotation_direction = value;
}
