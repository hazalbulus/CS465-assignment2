window.onload = function() {
    var canvas = document.getElementById('gl-canvas');
    var gl = initWebGL(canvas); // Initialize the GL context

    // Initialize shaders, program, and create buffers
    var program = initShaders(gl, vertexShaderSource, fragmentShaderSource);
    var octopusModel = createOctopusModel(gl); // Create model

    function setupSliderListeners() {
        function updateTentacleBase(tentacleNumber, angle) {
            // Update the base joint of tentacle number `tentacleNumber` with the new `angle`
            // You will need to implement this to interact with your model
            console.log(`Tentacle ${tentacleNumber} Base angle: ${angle}`);
        }
    
        // Add listener for Tentacle 1 Base Slider
        document.getElementById('tentacle1BaseSlider').addEventListener('input', function(event) {
            updateTentacleBase(1, parseFloat(event.target.value));
        });
    
        // Repeat the above block for each tentacle segment: mid and end, and for all tentacles
        // Tentacle 1 Mid Slider
        document.getElementById('tentacle1MidSlider').addEventListener('input', function(event) {
            // Update the middle joint of tentacle 1
        });
    
        // Tentacle 1 End Slider
        document.getElementById('tentacle1EndSlider').addEventListener('input', function(event) {
            // Update the end joint of tentacle 1
        });
    
        // ...repeat for Tentacle 2 Base, Mid, End... up to Tentacle 8
    }
    
    // Call this function when your application starts
    window.onload = function() {
        setupSliderListeners();
        // ... other initialization code
    }
    
    
    function updateModel() {
        // Update the octopus model based on slider values
    }

    function drawScene(gl, program, model) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Bind buffers
        // Set shader uniforms
        // Draw elements
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.vertexPositionAttribute);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    

    function animate() {
        requestAnimationFrame(animate);
        updateModel();
        drawScene();
    }

    animate(); // Start the animation loop
};
