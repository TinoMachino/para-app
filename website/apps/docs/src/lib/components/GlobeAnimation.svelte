<script lang="ts">
	import { onMount } from 'svelte';

	// ============ CONFIGURABLE CONSTANTS ============
	let {
		lines = 25,
		globeScale = 1,
		textureScale = 1
	}: { lines?: number; globeScale?: number; textureScale?: number } = $props();
	const TILE_SIZE = 2; // 2x2 pixel tiles, each producing 2 characters
	const RENDER_SCALE = 4; // Render at higher resolution for box filtering (1 = no filtering)
	const TEXTURE_PATH = '/globe/solidmap.webp';
	const TEXTURE_COLOR_PATH = '/globe/globe-texture.png';
	const ROTATION_SPEED = 0.001;
	const DRAG_SENSITIVITY = 0.01;
	const SHOW_WEBGL_CANVAS = false;
	const AXIAL_TILT_X = -8 * (Math.PI / 180);
	const AXIAL_TILT_Z = 0;
	const CAMERA_FOV = 0.1;
	const SPHERE_SCALE = 0.14;
	const OUTLINE_SCALE = 1.025;
	const TEXTURE_OPACITY = 0.2;
	const ASCII_VISIBLE_THRESHOLD = 64;

	type MatrixBuffer = Float32Array<ArrayBufferLike>;
	const ASCII_MAP = [' ', '.', "'", '#'] as const;

	const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
out vec2 vTexCoord;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  vTexCoord = aTexCoord;
}
`;

	const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
  float land = texture(uTexture, vTexCoord).r;
  float alpha = 1.0 - land;
  fragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;

	const COLOR_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
  fragColor = texture(uTexture, vTexCoord);
}
`;

	const SOLID_FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

	// ============ MATH UTILITIES ============
	function multiplyMatrices(a: MatrixBuffer, b: MatrixBuffer): MatrixBuffer {
		const result = new Float32Array(16) as MatrixBuffer;
		for (let row = 0; row < 4; row++) {
			for (let col = 0; col < 4; col++) {
				const a0 = a[0 * 4 + row] ?? 0;
				const a1 = a[1 * 4 + row] ?? 0;
				const a2 = a[2 * 4 + row] ?? 0;
				const a3 = a[3 * 4 + row] ?? 0;
				const b0 = b[col * 4 + 0] ?? 0;
				const b1 = b[col * 4 + 1] ?? 0;
				const b2 = b[col * 4 + 2] ?? 0;
				const b3 = b[col * 4 + 3] ?? 0;
				result[col * 4 + row] = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
			}
		}
		return result;
	}

	function createRotationMatrix(
		axisX: number,
		axisY: number,
		axisZ: number,
		angle: number
	): MatrixBuffer {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		const t = 1 - c;
		const len = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);
		const x = axisX / len;
		const y = axisY / len;
		const z = axisZ / len;

		return new Float32Array([
			t * x * x + c,
			t * x * y + s * z,
			t * x * z - s * y,
			0,
			t * x * y - s * z,
			t * y * y + c,
			t * y * z + s * x,
			0,
			t * x * z + s * y,
			t * y * z - s * x,
			t * z * z + c,
			0,
			0,
			0,
			0,
			1
		]) as MatrixBuffer;
	}

	function createPerspectiveMatrix(
		fov: number,
		aspect: number,
		near: number,
		far: number
	): MatrixBuffer {
		const f = 1.0 / Math.tan(fov / 2);
		const nf = 1 / (near - far);
		return new Float32Array([
			f / aspect,
			0,
			0,
			0,
			0,
			f,
			0,
			0,
			0,
			0,
			(far + near) * nf,
			-1,
			0,
			0,
			2 * far * near * nf,
			0
		]) as MatrixBuffer;
	}

	function createModelViewMatrix(
		rotationMatrix: MatrixBuffer,
		scaleMultiplier: number = 1
	): MatrixBuffer {
		const tiltX = createRotationMatrix(1, 0, 0, -AXIAL_TILT_X);
		const tiltZ = createRotationMatrix(0, 0, 1, AXIAL_TILT_Z);
		const tiltMatrix = multiplyMatrices(tiltZ, tiltX);
		const combined = multiplyMatrices(tiltMatrix, rotationMatrix);

		const s = SPHERE_SCALE * globeScale * scaleMultiplier;
		return new Float32Array([
			(combined[0] ?? 0) * s,
			(combined[1] ?? 0) * s,
			(combined[2] ?? 0) * s,
			0,
			(combined[4] ?? 0) * s,
			(combined[5] ?? 0) * s,
			(combined[6] ?? 0) * s,
			0,
			(combined[8] ?? 0) * s,
			(combined[9] ?? 0) * s,
			(combined[10] ?? 0) * s,
			0,
			0,
			0,
			-3,
			1
		]) as MatrixBuffer;
	}

	function createUVSphere(latSegments: number, lonSegments: number) {
		const vertices: number[] = [];
		const texCoords: number[] = [];
		const indices: number[] = [];

		for (let lat = 0; lat <= latSegments; lat++) {
			const theta = (lat * Math.PI) / latSegments;
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for (let lon = 0; lon <= lonSegments; lon++) {
				const phi = (lon * 2 * Math.PI) / lonSegments;
				const sinPhi = Math.sin(phi);
				const cosPhi = Math.cos(phi);

				const x = -cosPhi * sinTheta;
				const y = cosTheta;
				const z = sinPhi * sinTheta;

				vertices.push(x, y, z);
				texCoords.push(lon / lonSegments, lat / latSegments);
			}
		}

		for (let lat = 0; lat < latSegments; lat++) {
			for (let lon = 0; lon < lonSegments; lon++) {
				const first = lat * (lonSegments + 1) + lon;
				const second = first + lonSegments + 1;

				indices.push(first, second, first + 1);
				indices.push(second, second + 1, first + 1);
			}
		}

		return {
			vertices: new Float32Array(vertices),
			texCoords: new Float32Array(texCoords),
			indices: new Uint16Array(indices)
		};
	}

	function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
		const shader = gl.createShader(type)!;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(`Shader compile error: ${error}`);
		}
		return shader;
	}

	function createProgram(
		gl: WebGL2RenderingContext,
		vertexShader: WebGLShader,
		fragmentShader: WebGLShader
	): WebGLProgram {
		const program = gl.createProgram()!;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const error = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Program link error: ${error}`);
		}
		return program;
	}

	function loadTexture(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> {
		return new Promise((resolve, reject) => {
			const texture = gl.createTexture()!;
			const image = new Image();
			image.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				resolve(texture);
			};
			image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
			image.src = url;
		});
	}

	function convertToAscii(
		pixels: Uint8Array,
		width: number,
		height: number,
		outputLines: number
	): string {
		const outputWidth = outputLines * TILE_SIZE;
		const outputHeight = outputLines * TILE_SIZE;

		const getAveragedAlpha = (outX: number, outY: number): number => {
			let sum = 0;
			for (let sy = 0; sy < RENDER_SCALE; sy++) {
				for (let sx = 0; sx < RENDER_SCALE; sx++) {
					const srcX = outX * RENDER_SCALE + sx;
					const srcY = outY * RENDER_SCALE + sy;
					const srcIndex = ((height - 1 - srcY) * width + srcX) * 4 + 3;
					sum += pixels[srcIndex] ?? 0;
				}
			}
			return sum / (RENDER_SCALE * RENDER_SCALE);
		};

		const linesArr: string[] = [];
		const tilesX = outputWidth / TILE_SIZE;
		const tilesY = outputHeight / TILE_SIZE;

		for (let ty = 0; ty < tilesY; ty++) {
			let line = '';
			for (let tx = 0; tx < tilesX; tx++) {
				const baseY = ty * TILE_SIZE;
				const baseX = tx * TILE_SIZE;

				const tl = getAveragedAlpha(baseX, baseY) > ASCII_VISIBLE_THRESHOLD;
				const tr = getAveragedAlpha(baseX + 1, baseY) > ASCII_VISIBLE_THRESHOLD;
				const bl = getAveragedAlpha(baseX, baseY + 1) > ASCII_VISIBLE_THRESHOLD;
				const br = getAveragedAlpha(baseX + 1, baseY + 1) > ASCII_VISIBLE_THRESHOLD;

				const leftPattern = (tl ? 2 : 0) | (bl ? 1 : 0);
				const rightPattern = (tr ? 2 : 0) | (br ? 1 : 0);

				line += (ASCII_MAP[leftPattern] ?? ' ') + (ASCII_MAP[rightPattern] ?? ' ');
			}
			linesArr.push(line);
		}
		return linesArr.join('\n');
	}

	const MONOSPACE_FONT_STACK = [
		'"IBM Plex Mono"',
		'"Cascadia Mono"',
		'"SF Mono"',
		'"Fira Mono"',
		'"Roboto Mono"',
		'"Source Code Pro"',
		'"JetBrains Mono"',
		'"Consolas"',
		'"Menlo"',
		'"Liberation Mono"',
		'"DejaVu Sans Mono"',
		'"Courier New"',
		'monospace'
	].join(', ');

	// Component state
	let canvasSize = $derived(lines * TILE_SIZE * RENDER_SCALE);
	let charsPerLine = $derived(lines * TILE_SIZE);

	let containerRef: HTMLDivElement;
	let canvasRef: HTMLCanvasElement;
	let textureCanvasRef: HTMLCanvasElement;
	let preRef: HTMLPreElement;

	let asciiText = $state('');
	let preSize = $state({ width: 0, height: 0 });
	let isDragging = $state(false);
	let rotationMatrix = $state<MatrixBuffer>(
		new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) as MatrixBuffer
	);
	let animationIdMain: number;
	let animationIdTex: number;
	let lastMouseX = 0;
	let lastMouseY = 0;
	let resizeObserver: ResizeObserver;

	// Global mouse handlers
	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		const deltaX = e.clientX - lastMouseX;
		const deltaY = e.clientY - lastMouseY;
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;

		if (deltaX !== 0) {
			const rotY = createRotationMatrix(0, 1, 0, deltaX * DRAG_SENSITIVITY);
			rotationMatrix = multiplyMatrices(rotY, rotationMatrix);
		}
		if (deltaY !== 0) {
			const rotX = createRotationMatrix(1, 0, 0, deltaY * DRAG_SENSITIVITY);
			rotationMatrix = multiplyMatrices(rotX, rotationMatrix);
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	onMount(() => {
		// Resize Observer for Pre
		const updateSize = () => {
			if (!preRef) return;
			const rect = preRef.getBoundingClientRect();
			preSize = {
				width: Math.round(rect.width),
				height: Math.round(rect.height)
			};
			initTextureCanvas();
		};

		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(updateSize);
		} else {
			updateSize();
		}
		resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(preRef);

		initMainCanvas();

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			cancelAnimationFrame(animationIdMain);
			cancelAnimationFrame(animationIdTex);
			resizeObserver.disconnect();
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});

	async function initMainCanvas() {
		const gl = canvasRef.getContext('webgl2', { alpha: true, preserveDrawingBuffer: true });
		if (!gl) return;

		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		const solidFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, SOLID_FRAGMENT_SHADER);

		const program = createProgram(gl, vertexShader, fragmentShader);
		const outlineProgram = createProgram(gl, vertexShader, solidFragmentShader);

		const aPosition = gl.getAttribLocation(program, 'aPosition');
		const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
		const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
		const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
		const uTexture = gl.getUniformLocation(program, 'uTexture');

		const outlineAPosition = gl.getAttribLocation(outlineProgram, 'aPosition');
		const outlineUModelViewMatrix = gl.getUniformLocation(outlineProgram, 'uModelViewMatrix');
		const outlineUProjectionMatrix = gl.getUniformLocation(outlineProgram, 'uProjectionMatrix');

		const sphere = createUVSphere(32, 64);

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

		const texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

		const indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

		const vao = gl.createVertexArray()!;
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.enableVertexAttribArray(aPosition);
		gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.enableVertexAttribArray(aTexCoord);
		gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		const outlineVao = gl.createVertexArray()!;
		gl.bindVertexArray(outlineVao);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.enableVertexAttribArray(outlineAPosition);
		gl.vertexAttribPointer(outlineAPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		const texture = await loadTexture(gl, TEXTURE_PATH);

		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(0, 0, 0, 0);

		const projectionMatrix = createPerspectiveMatrix(CAMERA_FOV, 1, 0.1, 100);
		const pixels = new Uint8Array(canvasSize * canvasSize * 4);
		const oldPixels = new Uint8Array(canvasSize * canvasSize * 4);

		const render = () => {
			if (!isDragging) {
				const autoRotation = createRotationMatrix(0, 1, 0, ROTATION_SPEED);
				rotationMatrix = multiplyMatrices(autoRotation, rotationMatrix);
			}

			gl.viewport(0, 0, canvasSize, canvasSize);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.useProgram(outlineProgram);
			const outlineModelViewMatrix = createModelViewMatrix(rotationMatrix, OUTLINE_SCALE);
			gl.uniformMatrix4fv(outlineUModelViewMatrix, false, outlineModelViewMatrix);
			gl.uniformMatrix4fv(outlineUProjectionMatrix, false, projectionMatrix);
			gl.bindVertexArray(outlineVao);
			gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

			gl.clear(gl.DEPTH_BUFFER_BIT);

			gl.useProgram(program);
			const modelViewMatrix = createModelViewMatrix(rotationMatrix);
			gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
			gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(uTexture, 0);

			gl.bindVertexArray(vao);
			gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

			gl.readPixels(0, 0, canvasSize, canvasSize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

			for (let i = 0; i < pixels.length; i++) {
				pixels[i] = (oldPixels[i] ?? 0) * 0.99 + (pixels[i] ?? 0) * 0.01;
			}
			oldPixels.set(pixels);

			asciiText = convertToAscii(pixels, canvasSize, canvasSize, lines);
			animationIdMain = requestAnimationFrame(render);
		};

		render();
	}

	async function initTextureCanvas() {
		if (!textureCanvasRef || preSize.width === 0 || preSize.height === 0) return;
		textureCanvasRef.width = preSize.height;
		textureCanvasRef.height = preSize.height;

		const gl = textureCanvasRef.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
		if (!gl) return;

		if (animationIdTex) cancelAnimationFrame(animationIdTex);

		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, COLOR_FRAGMENT_SHADER);
		const program = createProgram(gl, vertexShader, fragmentShader);

		const aPosition = gl.getAttribLocation(program, 'aPosition');
		const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
		const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
		const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
		const uTexture = gl.getUniformLocation(program, 'uTexture');

		const sphere = createUVSphere(32, 64);
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);

		const texCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, sphere.texCoords, gl.STATIC_DRAW);

		const indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

		const vao = gl.createVertexArray()!;
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.enableVertexAttribArray(aPosition);
		gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
		gl.enableVertexAttribArray(aTexCoord);
		gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		const texture = await loadTexture(gl, TEXTURE_COLOR_PATH);

		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(0, 0, 0, 0);
		const projectionMatrix = createPerspectiveMatrix(CAMERA_FOV, 1, 0.1, 100);

		const render = () => {
			gl.viewport(0, 0, preSize.height, preSize.height);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.useProgram(program);
			const modelViewMatrix = createModelViewMatrix(rotationMatrix);
			gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
			gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(uTexture, 0);

			gl.bindVertexArray(vao);
			gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

			animationIdTex = requestAnimationFrame(render);
		};

		render();
	}

	function handleContainerMouseDown(e: MouseEvent) {
		isDragging = true;
		lastMouseX = e.clientX;
		lastMouseY = e.clientY;
	}

	function handleContainerMouseLeave() {
		isDragging = false;
	}

	function handleTouchStart(e: TouchEvent) {
		const touch = e.touches[0];
		if (e.touches.length === 1 && touch) {
			isDragging = true;
			lastMouseX = touch.clientX;
			lastMouseY = touch.clientY;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || e.touches.length !== 1) return;
		const touch = e.touches[0];
		if (!touch) return;
		if (e.cancelable) e.preventDefault();
		const deltaX = touch.clientX - lastMouseX;
		const deltaY = touch.clientY - lastMouseY;
		lastMouseX = touch.clientX;
		lastMouseY = touch.clientY;

		if (deltaX !== 0) {
			const rotY = createRotationMatrix(0, 1, 0, deltaX * DRAG_SENSITIVITY);
			rotationMatrix = multiplyMatrices(rotY, rotationMatrix);
		}
		if (deltaY !== 0) {
			const rotX = createRotationMatrix(1, 0, 0, deltaY * DRAG_SENSITIVITY);
			rotationMatrix = multiplyMatrices(rotX, rotationMatrix);
		}
	}

	function handleTouchEnd() {
		isDragging = false;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={containerRef}
	style="position: relative; cursor: grab; touch-action: none;"
	onmousedown={handleContainerMouseDown}
	onmouseleave={handleContainerMouseLeave}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<canvas
		bind:this={canvasRef}
		width={canvasSize}
		height={canvasSize}
		style="display: {SHOW_WEBGL_CANVAS ? 'block' : 'none'};"
	></canvas>
	<canvas
		bind:this={textureCanvasRef}
		style="position: absolute; top: 50%; left: 50%; width: {preSize.height * textureScale}px; height: {preSize.height * textureScale}px; transform: translate(-50%, -50%); transform-origin: center; pointer-events: none; opacity: {TEXTURE_OPACITY};"
	></canvas>
	<pre
		bind:this={preRef}
		class="globe-ascii"
		style="
      position: relative; margin: 0; padding: 0; user-select: none;
      font-family: {MONOSPACE_FONT_STACK}; font-weight: bold; line-height: 1.2;
      width: {charsPerLine}ch; height: {lines * 1.2}em; white-space: pre;
      font-feature-settings: 'liga' 0, 'clig' 0, 'dlig' 0, 'kern' 0, 'calt' 0;
      font-variant-ligatures: none; text-size-adjust: none; -webkit-text-size-adjust: none;
      text-rendering: geometricPrecision;
    ">{asciiText}</pre>
</div>

<style>
	.globe-ascii {
		font-size: clamp(8px, 1.2vw, 16px);
		color: var(--ps-globe-color, #70a4ff);
		background: transparent;
	}
</style>
