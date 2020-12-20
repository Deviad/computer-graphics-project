import THREE from "three.js";
import dat from "dat.gui";
import { animationFrameScheduler, interval, timer } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";

import marble from './images/marble.jpg';

// scalar to simulate speed
let speed = 0.05;
const direction = new THREE.Vector3(0, -1, 0);
const EasingFunctions = {
    // no easing, no acceleration
    linear: t => t,
};

function initState() {

    /*
        Object literals, adica obiecte instantiate direct in codul sursa, sunt pentru definitie
        de obiect literal singleton.
        InitState este o fabrica de obiecte care genereaza starea initiala a aplicatiei

     */


    return {
        /*
          O scena este un grup de elemente diferite care sunt parte a lumi pe care dorim sa reprezentam.
          Elementele sunt obiecte 3d, camera, punctele de lumina, sunetele, efectele speciale de exemplu ciata.
         */
        scene: new THREE.Scene(),


        /*
            O camera (de filmat) reprezenta ochi prin care privim lumea. O scena contine diferite camere, totusi doar
            o singura camere poate fi activa in un timp anume.
            PerspectiveCamera este o camera care foloseste o proiectia perspectiva.
         */

        camera: new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        ),


        /*
            Renderer este o functie care creaza un element din DOM astfel in cat poate fi adaugat unei pagini web.
            Acest rendereer poate folosi WEBGL, canvas, CSS3.
         */

        renderer: new THREE.WebGLRenderer(),

        /*
            Mesh sunt obiectele 3D care pot fi adaugati unei scenei.
            Aceste obiecte sunt facute de niste geometrii (forme) si de materiale.
            Materiale sunt facute de coloare, textura si efectele de lumina.
         */


        /*
            Aici creez planul unde roteaza cubul.
         */

        plane: new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        ),

        /*
            Aici specific detalile pentru a genera Cubul.
            BoxGeometry reprezinta o clasa de geometrie pentru crearea o forma care arata ca un cub
            rectangular cu latime, inaltime si profunzime.
         */

        cube: new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({
                color: 0xbdbdbd,
                transparent: true,
                opacity: 1,
                map: new THREE.TextureLoader().load(marble),
            })
        ),

        /*
            E un tip de lumina uniforme care ilumineza scena in fel uniform.
            Acesta lumina nu poate fi folosita pentru a desemna umbrele fiindca nu are o directie.
         */

        ambient: new THREE.AmbientLight(0xffffff, 0.3),

        /*
            E un tip de lumina care se duce catre o specifica directie si poate crea umbre.
         */

        light: new THREE.DirectionalLight(0xffffff, 1),


        /*

        Clock este folosit pentru a urmari timpul si se bazeza pe functie furnizata din browser performance.now.
        In cazul in care este folosit un browser mai vec, foloseste Date.now.
        */

        clock: new THREE.Clock(),

        /*
            Acest obiect contine parametri initiali folositi de utilitate DAT (in partea drapta superioare a ecranului)
            pentru a schimba in timp real culoarile, etc a unui obiect.
         */

        control: {
            rotationSpeed: 0.5,
            opacity: 1,
            color: 0xbdbdbd
        },

        // raycaster "translates" the x,y coordinates of the mouse on the plane surface into 3D coordinates (x,y,z),
        // taking into account those that are the visible parts of objects on the scene.
        // It excludes the hidden portions of objects.

        /*
            Raycaster este capabil sa convertesca coordonatele mouse-ului pe superfata plana in coordonatele 3D (x,y,z),
            avand in considerare cele parti care sunt visibile a obiectelor pe scena si stie sa excluda portile ascunse
            a obiectelor.

            Raycaster ne permite sa selectam cu pointer-ul mouse-ului partile obiectelor la vedere.

         */

        raycaster: new THREE.Raycaster(),
        selected: undefined,
        mouse: new THREE.Vector2(), //Vector2 it's used do represent a couple of coordinates on a 2D plane.
        // In my case they are the coordinates of the mouse on the screen.
        spheres: []
    };
}

const state = initState();

/*
Aici folosesc o functionalitate din ES6 care se numeste object destructuring care mi permite de a decompune un obiect
    in componentele din care este facut astfel in cat sunt pregatite pentru a fi folosite in cod.


    in loc de a folosi state.scene, in acest fel pot folosi direct scene mai departe.

 */

const {
    scene,
    camera,
    renderer,
    plane,
    cube,
    spheres,
    ambient,
    light,
    clock,
    control,
    selected,
    raycaster,
    mouse
} = state;


/*
 Astea sunt functile care contin codul folosit din ascultatoari de evenimente curespunzatoare.
 Acesti ascultatori sunt oferiti din dom si ne permit sa executam niste actiuni in momentul in care se verifica un event.
 Ascultatori de evenimente sunt atasati din dezvoltatorul pe elementele dorite din DOM.
 Un event trece prin 3 faze:

 - Event capturing: faza in care un eveniment ste capturat dar inca nu a ajuns la target.
 - Event target: eveniment a juns la target.
 - Event bubbling: evenimentul sare prin lansul de elementele a DOM-ului si in acesta faza poate fi capturat si din
 elementele care reprezinta copiilor a elementului pe care ascultatorul a fost plasat.


 */

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    if (selected) {
        selected.currentHex = 0x00ff00 * Math.random();
        selected.material.emissive.setHex(selected.currentHex);
    }
}

/*
    Renderer este o functie care creaza un element din DOM astfel in cat poate fi adaugat unei pagini web.
    Acest rendereer poate folosi WEBGL, canvas, CSS3.
 */

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


    /*
    ...Array(4) este o scurtatura prin care folosind un numar in constructor de Array, putem genera un array de 4 elemente
        care o sa aiba valoare "undefined".

     */

    [...Array(4).keys()].forEach(x => {
        const geometry = new THREE.DodecahedronGeometry(2, 0);
        const material = new THREE.MeshLambertMaterial({ color: 0x3483f, map: new THREE.TextureLoader().load(marble)});
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.y = 8;
        sphere.position.x = x * 5;

        spheres.push(sphere);
    });


    /*
        Aici adaug pe scena 4 obiectele cu forma de dodecaedro (care pe ecran arata aproape ca o sfera)
     */

    spheres.forEach(x => {
        console.log("SPHERE IS", x);
        scene.add(x);
    });

    scene.add(plane);
    scene.add(cube);
    camera.lookAt(scene.position);
    scene.add(ambient);
    scene.add(light);

    addControlGui(control);

    const container = document.getElementById("app");
    container.appendChild(renderer.domElement);
    const resizeHOF = ({ camera, renderer }) => event =>
        handleResize({ camera, renderer });

    /*
        Aici folosesc o asa numita Higher Order Function, adica o functie de ordin superior: aceste idee se lega de partial
        evaluation si ne ajuta sa micsoram numarul de parametrelor care primeste o functie.
        De fapt, browser-ul se astepta o functie de callback in care singur parametru va fi evenimentul.
        Ex.:
        function(event) {
            console.log(event);
        }
        Totusi, noi avem nevoie sa iniectam parametri da care noi avem nevoie la randul nostru.
        Atunci partial computation vine in ajutorul nostru.
        Norocul este ca Javascript foloseste scope-ul lexical adica o variabila declarate intre o functie parinte
        este vizibila in interiorul unei functi imbricata.


     */
    /*
        Resize se refera la redimensionarea obiectului Window.
     */
    window.addEventListener("resize", resizeHOF({ camera, renderer }), false);
    document.addEventListener("mousemove", onDocumentMouseMove, false);
    container.addEventListener("mousedown", onDocumentMouseDown, false);
    window.addEventListener("resize", onWindowResize, false);

    render({ scene, renderer, camera, raycaster, selected, mouse });
}

function addControlGui(controlObject) {
    const gui = new dat.GUI();
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

function render({ scene, renderer, camera, raycaster, selected, mouse }) {
    const delta = clock.getDelta();
    // alert(`${delta}, ${control.rotationSpeed}`); // e ceva aleatoriu ca si Math.random
    const rotSpeed = delta * control.rotationSpeed;
    updateCamera(camera, rotSpeed, scene);

    scene.getObjectByName("cube").material.opacity = control.opacity;
    scene.getObjectByName("cube").material.color = new THREE.Color(control.color);
    requestAnimationFrame(() =>
        render({ scene, renderer, camera, raycaster, selected, mouse })
    );

    raycaster.setFromCamera(mouse, camera);

    // raycaster "translates" the x,y coordinates of the mouse on the plane surface into 3D coordinates (x,y,z),
    // taking into account those that are the visible parts of objects on the scene.
    // It excludes the hidden portions of objects.

    const intersects = raycaster.intersectObjects(scene.children);
    const container = document.getElementById("app");
    // console.log("SELECTED IS ", selected);
    if (intersects.length > 0) {
        if (selected !== intersects[0].object) {
            if (selected) selected.material.emissive.setHex(selected.currentHex);
            selected = intersects[0].object;
            console.log("MOUSE IS", mouse);
            // if(selected.name === "cube") {
            // 	alert("CUBEEEE");
            // }

            selected.currentHex = selected.material.emissive.getHex();
            selected.material.emissive.setHex(0xff0000);
            container.style.cursor = "pointer";
        }
    } else {
        if (selected) {
            selected.material.emissive.setHex(selected.currentHex);
            selected = null;
            container.style.cursor = "auto";
        }
    }

    renderer.render(scene, camera);
}

function handleResize({ camera, renderer }) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function move() {
    console.log("testttttttt");
    const vector = direction.clone().multiplyScalar(speed);
    /*

    Folosirea lui RXJS nu este obligatorie in cazul specific totusi am vrut sa il folosesc
    pentru ca observabile sunt des intalnite.

    Un Scheduler este o structura de date pentru a memora si a pune in unei cozi taskurile pe baza unei prioritati sau alte
    criterile. Un scheduler are un ceas virtual si poate obtine timpul prin metoda now().

    AnimationFrameScheduler programeaza o sarcina (task) astfel in cat sa se intample inainte de a desena continutul din nou pe ecran.


   */

    interval(0, animationFrameScheduler)
        .pipe(
            // map(frame=>Math.sin(frame/10)*50),
            takeUntil(timer(600)),
            tap(y => {
                console.log("y is:", y);
                for (const s of spheres) {
                    s.position.x = s.position.x + vector.x;
                    s.position.y = s.position.y + vector.y;
                    s.position.z = s.position.z + vector.z;
                }
            })
        )
        .subscribe();

    speed = EasingFunctions.linear(speed);
}
init();
move();
