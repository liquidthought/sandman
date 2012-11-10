
var gl; // GL context


var mousePos = [0, 0];
var prevMousePos = [0, 0];
var reset;
var reassemble = 0;
var mouseDown = 0;

var error = "";

	function doReassemble() {
	  reassemble = 200;
	}

function start() {
	start2();
	if (error != "") {$("#havefun").hide();$("#nofun").show();$("#nofun").html(error);}
}

// Function called by onload handler
function start2()
{


  // Gets canvas from the HTML page
  var canvas = document.getElementById('glcanvas');

  // Creates GL context
  gl = null;
  try {gl = canvas.getContext('experimental-webgl');}
  catch(e) {error = "Sorry your browser does not support WebGL.";return;}

  
  // If no exception but context creation failed, alerts user
  if(!gl) {error = "Sorry your browser does not support WebGL.";return;}
  

   var err = "Your browser does not support ";
   try { ext = gl.getExtension("OES_texture_float");
   } catch(e) {}
   if ( !ext ) {alert(err + "OES_texture_float extension"); return;}

  if (gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0){
  	error = "Sorry your browser does not support texture lookups within a vertex shader."; 
  	return;
  }
  
  // Sets clear color to non-transparent dark blue and clears context
  gl.clearColor(0.3, 0.3, 0.3, 1.0);
  gl.clearDepth(1.0);
    
	function gxFrameBuffer() {
			var rttFramebuffer;
			var rttTexture;
	
			rttFramebuffer = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
			rttFramebuffer.width = 512;
			rttFramebuffer.height = 512;

			rttTexture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, rttTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP);  
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP);         
			
			//gl.generateMipmap(gl.TEXTURE_2D);

			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.FLOAT, null);

			var renderbuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
//			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
			//gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			
			this.frameBuffer = rttFramebuffer;
			this.texture = rttTexture;
	}

  function motionRenderer() {
  
  // Creates fragment shader (returns white color for any position)
  var fshader = gl.createShader(gl.FRAGMENT_SHADER);
  
  var fShaderSrcPre = [
  'uniform sampler2D srcSamplerX; ',
  'uniform sampler2D srcSamplerY; ',
  'uniform sampler2D noiseSampler; ',
  'uniform sampler2D timeSampler; ',
  'uniform int doX;',
  'uniform int doT;',
  'uniform int firstTime; ',
  'uniform int autoReassemble; ',
  'uniform highp float reassemble;',
  'uniform int mouseDown;',
  'uniform highp vec2 mouse; ',
  'uniform highp vec2 prevMouse; ',
  'varying highp vec2 zvTextureCoord; ',
  'void main(void) { ',
  'highp vec2 zvvTextureCoord = (zvTextureCoord * 612.0/512.0);',
  '	highp vec4 offsetsX = texture2D(srcSamplerX, vec2(zvvTextureCoord.s, zvvTextureCoord.t)); ',
  '	highp vec4 offsetsY = texture2D(srcSamplerY, vec2(zvvTextureCoord.s, zvvTextureCoord.t)); ',
  '	highp vec4 time = texture2D(timeSampler, vec2(zvvTextureCoord.s, zvvTextureCoord.t)); ',
//  ' highp float nT = ((time.r*65280.0+time.g*256.0));',
  'highp float nT = time.r;',
//  ' highp float deltaX = ((offsetsX.r*65280.0+offsetsX.g*256.0)/32768.0)-1.0;', // scaled to be -1.0 <=> 1.0
 // ' highp float deltaY = ((offsetsY.r*65280.0+offsetsY.g*256.0)/32768.0)-1.0;',
 	' highp float deltaX = offsetsX.r;',
 	' highp float deltaY = offsetsY.r;',
  ' highp vec2 delta = vec2(deltaX, deltaY)/**2.0*/;',
//  ' highp float vX = ((offsetsX.b*65280.0+offsetsX.a*256.0)/32768.0)-1.0;', // scaled to be -1.0 <=> 1.0
//  ' highp float vY = ((offsetsY.b*65280.0+offsetsY.a*256.0)/32768.0)-1.0;',
	'highp float vX = offsetsX.b;',
	'highp float vY = offsetsY.b;',
  ' if (vX < 0.0001 && vX > -0.0001) vX = 0.0;',
  ' if (vY < 0.0001 && vY > -0.0001) vY = 0.0;',
  '	highp vec4 sampleX = texture2D(srcSamplerX, vec2(zvvTextureCoord.s, zvvTextureCoord.t));',
  '	highp vec4 sampleY = texture2D(srcSamplerY, vec2(zvvTextureCoord.s, zvvTextureCoord.t));',
  '	highp float nx = deltaX;',
  ' highp float ny = deltaY;',

	'	if (firstTime < 3) {',
	'		nx = 0.0;',
	'		ny = 0.0;',
	'		vX = 0.0;',
	'		vY = 0.0;',
	'		nT = 0.0;',
	'	}',
  ' else {',
  ' highp vec2 sm_original_position = (zvvTextureCoord * 2.0 - 1.0);',
  '	highp vec2 sm_displacement = vec2(deltaX, deltaY);',
  ' highp vec2 sm_position = sm_original_position + sm_displacement;',
  '	highp vec4 sm_noise = texture2D(noiseSampler, sm_original_position);',    
  '	highp vec2 sm_mouse = (vec2(mouse.x, mouse.y) * 2.0 -1.0);',
  '	highp vec4 noise = texture2D(noiseSampler, vec2(sm_position.x, sm_position.y));',  
  
  
  ].join("\n");
  var fShaderSrcPost = [
//  ' sm_displacement /= 2.0;',
  ' nx = sm_displacement.x;',
  ' ny = sm_displacement.y;',
  '}',

  'gl_FragColor = vec4(0.5, 0.0, 0.0, 1.0);',
  '  if (doT == 0) {',
  '		if (doX == 1) {',
  /*
  '			highp float v = (nx+1.0) * 32768.0 / 256.0;',
  '			if (v > 255.0) v = 255.0;',
  '			gl_FragColor.r = floor(v)/255.0;',
  '			gl_FragColor.g =  (v - floor(v));',
  '			v = (vX+1.0) * 32768.0 / 256.0;',
  '			gl_FragColor.b = floor(v)/255.0;',
  '			gl_FragColor.a =  (v - floor(v));',
  */
  ' gl_FragColor.r = nx;',
  ' gl_FragColor.b = vX;',
  '		}',
  '		else {',
  /*
  '			highp float v = (ny+1.0) * 32768.0 / 256.0;',
  '			if (v > 255.0) v = 255.0;',
  '			gl_FragColor.r = floor(v)/255.0;',
  '			gl_FragColor.g =  (v - floor(v));',
  '			v = (vY+1.0) * 32768.0 / 256.0;',
  '			gl_FragColor.b = floor(v)/255.0;',
  '			gl_FragColor.a =  (v - floor(v));',
  */
  ' gl_FragColor.r = ny;',
  ' gl_FragColor.b = vY;',
  '		}',  
  '		}',
  '	else {',
  '			if (autoReassemble == 1) nT = nT - 1.0;',
  '			if (nT <= 1.0) nT = 0.0;',
  /*
  '			highp float v = nT / 256.0;',
  '			if (v > 255.0) v = 255.0;',
  '			gl_FragColor.r = floor(v)/255.0;',
  '			gl_FragColor.g =  (v - floor(v));',
  */
  'gl_FragColor.r = nT;',
  ' }',
  '}'
  ].join("\n");
  
  var fShaderSrc = fShaderSrcPre + particleSrc + fShaderSrcPost;
  
  gl.shaderSource(fshader, fShaderSrc);
  
  gl.compileShader(fshader);
  if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) 
  {alert('Error during fragment shader compilation:\n' + gl.getShaderInfoLog(fshader)); return;}

  // Creates vertex shader (converts 2D point position to coordinates)
  var vshader = gl.createShader(gl.VERTEX_SHADER);
  
  var vShaderSrc = [
  'attribute vec2 ppos; ',
  'attribute vec2 zTextureCoord; ',
  'varying highp vec2 zvTextureCoord; ',
  'void main(void) { ',
  '	zvTextureCoord = zTextureCoord; ',
  '	gl_Position = vec4(ppos.x, ppos.y, 0.0, 1.0); ',
  '}'
  ].join("\n");
  gl.shaderSource(vshader, vShaderSrc);
  gl.compileShader(vshader);
  if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) 
  {alert('Error during vertex shader compilation:\n' + gl.getShaderInfoLog(vshader)); return;}

  // Creates program and links shaders to it
  var program = gl.createProgram();
  gl.attachShader(program, fshader);
  gl.attachShader(program, vshader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
  {alert('Error during program linking:\n' + gl.getProgramInfoLog(program));return;}

  // Validates and uses program in the GL context
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) 
  {alert('Error during program validation:\n' + gl.getProgramInfoLog(program));return;}
  gl.useProgram(program);

  // Gets address of the input 'attribute' of the vertex shader
  var vattrib = gl.getAttribLocation(program, 'ppos');
  if(vattrib == -1)
  {alert('Error during attribute address retrieval');return;}
  
	var ztextureCoordAttribute = gl.getAttribLocation(program, "zTextureCoord");  

  // Initializes the vertex buffer and sets it as current one

  // Puts vertices to buffer and links it to attribute variable 'ppos'

  var v = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
  var vertices = new Float32Array(v);
	
  var u = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
  var texcoords = new Float32Array(u);
  
  var vbuffer = gl.createBuffer();
  var ubuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

  gl.uniform1i(gl.getUniformLocation(program, "srcSamplerX"), 3);
  gl.uniform1i(gl.getUniformLocation(program, "srcSamplerY"), 4);
  gl.uniform1i(gl.getUniformLocation(program, "noiseSampler"), 5);
  gl.uniform1i(gl.getUniformLocation(program, "timeSampler"), 6);

	var firstTime = 0;
	
	reset = function() {
		firstTime = 0;
	}

	var noiseTexture;
	var noiseImage;

	this.drawScene = function(srcX, srcY, dstX, dstY, srcT, dstT) {

		gl.useProgram(program);
	
		gl.activeTexture(gl.TEXTURE6);
		gl.bindTexture(gl.TEXTURE_2D, srcT.texture);
	
		gl.activeTexture(gl.TEXTURE5);
		gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
	
	
		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, srcX.texture);
	
		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, srcY.texture);

	
		gl.uniform1i(gl.getUniformLocation(program, "mouseDown"), mouseDown);
		gl.uniform1i(gl.getUniformLocation(program, "firstTime"), firstTime);
		firstTime = firstTime + 1;
	
		gl.uniform1i(gl.getUniformLocation(program, "autoReassemble"), $("#auto_reassemble").attr("checked")?1:0);
		gl.uniform1f(gl.getUniformLocation(program, "reassemble"), reassemble);
		if (reassemble > 0) {
			reassemble = reassemble-1;
			$("#glcanvas").css({cursor:"wait"});			
		}
		else {
			$("#glcanvas").css({cursor:"pointer"});			
		}
	
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	
		gl.vertexAttribPointer(vattrib, 2, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
	
		gl.vertexAttribPointer(ztextureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
		gl.enableVertexAttribArray(vattrib);
		gl.enableVertexAttribArray(ztextureCoordAttribute);
		gl.uniform2f(gl.getUniformLocation(program, "prevMouse"), mousePos[0]-prevMousePos[0], mousePos[1]-prevMousePos[1]);
		gl.uniform2f(gl.getUniformLocation(program, "mouse"), mousePos[0], mousePos[1]);
		prevMousePos = mousePos;
	
		gl.uniform1i(gl.getUniformLocation(program, "doT"), 1);
		gl.bindFramebuffer(gl.FRAMEBUFFER, dstT.frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.uniform1i(gl.getUniformLocation(program, "doT"), 0);
		gl.uniform1i(gl.getUniformLocation(program, "doX"), 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, dstY.frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.uniform1i(gl.getUniformLocation(program, "doX"), 1);
		gl.bindFramebuffer(gl.FRAMEBUFFER, dstX.frameBuffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		
		gl.flush()
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				
	}
		
	function initTextures() {  
		noiseTexture = gl.createTexture();  
		noiseImage = new Image();  
		noiseImage.onload = function() { handleTextureLoaded2(noiseImage, noiseTexture); }  
		noiseImage.src = "./noise.png";  
	}  
      
	var parentFunction = this;
	this.ready = false;
	this.program = program;

  function handleTextureLoaded2(image, texture) {  
		gl.activeTexture(gl.TEXTURE5);  
		gl.bindTexture(gl.TEXTURE_2D, texture);  
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);  
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);         
		 
		gl.activeTexture(gl.TEXTURE5);  
		gl.bindTexture(gl.TEXTURE_2D, texture);       
		gl.uniform1i(gl.getUniformLocation(program, "uSamplerNoise"), 5);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		parentFunction.ready = true;
  }  
  
	initTextures();
}
    
    
    //---------------- end of motion stage -----------------  
  
  function particleRenderer() {
  
		// Creates fragment shader (returns white color for any position)
		var fshader = gl.createShader(gl.FRAGMENT_SHADER);
		var fShaderSrc = [
			'uniform sampler2D photoSampler;',
			'varying highp vec2 vTextureCoord;',
			'void main(void) {',
			'	gl_FragColor = texture2D(photoSampler, vec2(vTextureCoord.s, vTextureCoord.t));',
			'}'
		].join("\n");
		gl.shaderSource(fshader, fShaderSrc);
		gl.compileShader(fshader);
		if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) 
		{alert('Error during fragment shader compilation:\n' + gl.getShaderInfoLog(fshader)); return;}
		
		// Creates vertex shader (converts 2D point position to coordinates)
		var vshader = gl.createShader(gl.VERTEX_SHADER);
		var vShaderSrc = [
		'uniform sampler2D uSamplerX;',
		'uniform sampler2D uSamplerY;',
		'attribute vec2 ppos;',
		'attribute vec2 aTextureCoord;',
		'varying highp vec2 vTextureCoord;',
		'void main(void) {',
		'	vTextureCoord = aTextureCoord;',
		'	vec4 offsetsX = texture2D(uSamplerX, vec2(aTextureCoord.x, aTextureCoord.y));',
		'	vec4 offsetsY = texture2D(uSamplerY, vec2(aTextureCoord.x, aTextureCoord.y));',
		/*
		' highp float deltaX = ((offsetsX.r*65280.0+offsetsX.g*256.0)/32768.0)-1.0;', // scaled to be -1.0 <=> 1.0
		' highp float deltaY = ((offsetsY.r*65280.0+offsetsY.g*256.0)/32768.0)-1.0;',
		*/
		'highp float deltaX = offsetsX.r;',
		'highp float deltaY = offsetsY.r;',
//		' highp vec2 delta = vec2(deltaX, deltaY);',
		' highp float newX = ppos.x + deltaX/**2.0*/;',
		' highp float newY = ppos.y - deltaY/**2.0*/;',
		' highp float adx = deltaX < 0.0? deltaX * -1.0: deltaX;',
		' highp float ady = deltaY < 0.0? deltaY * -1.0: deltaY;',
		' highp float newz = -((adx*ady)*0.005);',
		' gl_Position = vec4(newX, newY, newz, 1.0);',
//		' gl_PointSize = 1.2 + adx*ady*2.0;',
		' gl_PointSize = 1.2;',
		'}'
		].join("\n");
		gl.shaderSource(vshader, vShaderSrc);
		gl.compileShader(vshader);
		if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) 
		{alert('Error during vertex shader compilation:\n' + gl.getShaderInfoLog(vshader)); return;}
		
		// Creates program and links shaders to it
		var program = gl.createProgram();
		gl.attachShader(program, fshader);
		gl.attachShader(program, vshader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
		{alert('Error during program linking:\n' + gl.getProgramInfoLog(program));return;}
		
		// Validates and uses program in the GL context
		gl.validateProgram(program);
		if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) 
		{alert('Error during program validation:\n' + gl.getProgramInfoLog(program));return;}
		
		gl.useProgram(program);
		
		// Gets address of the input 'attribute' of the vertex shader
		var vattrib2 = gl.getAttribLocation(program, 'ppos');
		if(vattrib2 == -1)
		{alert('Error during attribute address retrieval');return;}
		console.log(vattrib2);
		
		var textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");  
		
		var v = [];
		
		var iw = 512.0;
		var ih = 512.0;
		var cw = 612.0;
		var ch = 612.0;
		var il = 50.0;
		var it = 50.0;
		
		for (var i = 0; i < ih; i++) {
			for (var j = 0; j < iw; j++) {
				v.push(((j+il)/(cw-1.0))*2-1.0); v.push(((i+it)/(ch-1.0))*2-1.0);
			}
		}
		
		var u = [];
		for (var i = 0; i < ih; i++) {
			for (var j = 0; j < iw; j++) {
//				u.push(-1.0+(j/511.0)); u.push(1.0-(i/511.0));
				u.push((j/512.0)); u.push(511.0/512-(i/512.0));
			}
		}
				
		var vertices = new Float32Array(v);
		var texcoords = new Float32Array(u);
		
		var vbuffer = gl.createBuffer();
		var ubuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
		
		var numberFrame = 0;
		var startTime = (new Date).getTime();
		
		this.drawScene = function(dstX, dstY) {
		
			gl.useProgram(program);
			
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, dstX.texture);
			gl.uniform1i(gl.getUniformLocation(particles.program, "uSamplerX"), 1);
			
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, dstY.texture);
			gl.uniform1i(gl.getUniformLocation(particles.program, "uSamplerY"), 2);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
			gl.vertexAttribPointer(vattrib2, 2, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, ubuffer); 
			gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);  
			
			gl.enableVertexAttribArray(vattrib2);
			gl.enableVertexAttribArray(textureCoordAttribute)  
		
			// Draws the photo as a bunch of points
			gl.drawArrays(gl.POINTS, 0, 512*512);
			gl.flush()
			
			numberFrame++;
	
			if (numberFrame % 60 === 0.0) {
					var nd = (new Date).getTime();
					var diff = nd - startTime;
	
					jQuery("#fps").text(Math.floor(numberFrame/(diff/1000)) + " fps");
					startTime = nd;
					numberFrame = 0;
			}		
			
		}

		var photoTexture;
		var photoImage;

    function initTextures() {  
      photoTexture = gl.createTexture();  
      photoImage = new Image();  
      photoImage.onload = function() { handleTextureLoaded(photoImage, photoTexture); }  
      photoImage.src = "./sandbox.jpg";  
    }  
      
		var parentFunction = this;
		this.ready = false;
		this.program = program;

    function handleTextureLoaded(image, texture) {  
			gl.activeTexture(gl.TEXTURE0);  
      gl.bindTexture(gl.TEXTURE_2D, texture);  
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR /*_MIPMAP_NEAREST*/);  
//      gl.generateMipmap(gl.TEXTURE_2D);                
		  gl.uniform1i(gl.getUniformLocation(program, "photoSampler"), 0);
			parentFunction.ready = true;
    }  
    
    initTextures();
    
  }
    
	var fbX1 = new gxFrameBuffer();
	var fbY1 = new gxFrameBuffer();
	var fbX2 = new gxFrameBuffer();
	var fbY2 = new gxFrameBuffer();
	var fbT1 = new gxFrameBuffer();
	var fbT2 = new gxFrameBuffer();
	
	var motion = new motionRenderer();
  var particles = new particleRenderer();
      
  var fbi = true;
    
	function tick() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		if (motion.ready) 
		{
			var srcX;
			var srcY;
			var dstX;
			var dstY;
			var srcT;
			var dstT;
			
			if (fbi) { 
				srcX = fbX1
				srcY = fbY1;
				dstX = fbX2;
				dstY = fbY2;
				srcT = fbT1;
				dstT = fbT2;
			}
			else {
				srcX = fbX2;
				srcY = fbY2;
				dstX = fbX1;
				dstY = fbY1;
				srcT = fbT2;
				dstT = fbT1;
			}
			fbi = !fbi;
			
			gl.disable(gl.DEPTH_TEST);
			motion.drawScene(srcX, srcY, dstX, dstY, srcT, dstT);
			
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			gl.enable(gl.DEPTH_TEST);  
			gl.depthFunc(gl.LEQUAL);
				
			if (particles.ready) {
				particles.drawScene(dstX, dstY);
			}
		}
	}
	
	// 60hz
	window.setInterval(tick, 1000/60);        
}



