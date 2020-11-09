import './styles.css';

import THREE from "three.js";
import dat from "dat.gui";

function initState() {
	return {
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		),
		renderer: new THREE.WebGLRenderer(),
		plane: new THREE.Mesh(
			new THREE.PlaneGeometry(20, 20),
			new THREE.MeshLambertMaterial({color: 0xcccccc})),
		cube:  new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), new THREE.MeshLambertMaterial({
			color: 0x086113,
			transparent: true,
			opacity: 1
		})),
		ambient: new THREE.AmbientLight(0xffffff, 0.3),
		light: new THREE.DirectionalLight(0xffffff, 1, 100, 2),
		clock: new THREE.Clock(),
		control: {
			rotationSpeed: 0.5,
			opacity: 1,
			color: 0x086113
		},
	}
}

const state = initState();
const {scene, camera, renderer, plane, cube, ambient, light, clock, control} = state;

function buildRenderer() {
	renderer.setClearColor(0x000000, 1.0);
	renderer.physicallyCorrectLights = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildPlane() {
	plane.receiveShadow = true;
	plane.rotation.x = -0.5 * Math.PI;
	plane.position.x = 0;
	plane.position.y = -2;
	plane.position.z = 0;
}

function buildCamera() {
	camera.position.x = 15;
	camera.position.y = 16;
	camera.position.z = 13;
}

function buildCube() {
	cube.name = "cube";
	cube.castShadow = true;
}

function buildLight() {
	light.position.set(10, 20, 20);
	light.castShadow = true;
}

function init() {

	buildRenderer();
	buildPlane();
	buildCube();
	buildLight();
	buildCamera();

	scene.add(plane);
	scene.add(cube);
	camera.lookAt(scene.position);
	scene.add(ambient);
	scene.add(light);

	addControlGui(control);

	document.getElementById("app").appendChild(renderer.domElement);

	render({scene, renderer, camera});
}

function addControlGui(controlObject) {
	var gui = new dat.GUI();
	gui.add(controlObject, "rotationSpeed", -1, 1);
	gui.add(controlObject, "opacity", 0.1, 1);
	gui.addColor(controlObject, "color");
}

function updateCamera(camera, rotSpeed, scene) {
	camera.position.x =
		camera.position.x * Math.cos(rotSpeed) +
		camera.position.z * Math.sin(rotSpeed);
	camera.position.z =
		camera.position.z * Math.cos(rotSpeed) -
		camera.position.x * Math.sin(rotSpeed);
	camera.lookAt(scene.position);
}

function render({scene, renderer, camera}) {
	const delta = clock.getDelta();
	// alert(`${delta}, ${control.rotationSpeed}`); // e ceva aleatoriu ca si Math.random
	const rotSpeed = Math.floor(Math.random() * 10)/100 * control.rotationSpeed;
	updateCamera(camera, rotSpeed, scene);

	scene.getObjectByName("cube").material.opacity = control.opacity;
	scene.getObjectByName("cube").material.color = new THREE.Color(control.color);

	requestAnimationFrame(() => render({scene, renderer, camera}));
	renderer.render(scene, camera);
}

function handleResize({camera, renderer}) {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

init();

const resizeHOF = ({camera, renderer}) => (event) => handleResize({camera, renderer});
window.addEventListener("resize", resizeHOF({camera, renderer}), false);
