const {animationFrameScheduler, interval, timer} = rxjs;
const {takeUntil, tap} = rxjs.operators;


// scalar to simulate speed
let speed = 0.05;
const direction = new THREE.Vector3(0, -1, 0);


function initState() {

    /*
        Object literals, adica o lista de cupluri cheia-valoare imbricate in parenteze acolade, sunt pentru definitie
        de obiect literal singleton.
        InitState este o fabrica de obiecte care genereaza starea initiala a aplicatiei

     */

    return {
        /*
          O scena este un grup de elemente diferite care sunt parte ale lumi pe care dorim sa-o reprezentam.
          Elementele sunt obiecte 3d, camera, punctele de lumina, sunetele, efectele speciale de exemplu ceata.
         */
        scene: new THREE.Scene(),


        /*
           Acesta modalitate de proiecte, acesta camera (de filmat), simuleza modul
           in care privesc lucrurile oameni.
           O scena poate contine diferite camere, totusi doar o singura camera poate fi activa in un timp anume.
            PerspectiveCamera este o camera care foloseste o proiectia perspectiva.

            Primul parametrul este fov: field of view, adica întinderea lumii observabile care este văzută la un moment
            dat. Se foloseste un unghiu, de ex. 45 grade.

            Al doilea parametru este aspect ratio, adica un numar ce exprima relatia intre lungimea si inaltimea.
            window.innerWidth si window.innerheight reprezinta dimensiunilor unei ferestre al browserului fara toolbar,
            bookmarks, etc.

            Al treila parametru este frustum near plane (planul ale obiectelor in apropriere),
            Al patrulea parametru este frustum far plane (planul ale obiectelor in indepartare).

            Cuvântul frustum, trunchiu de piramida,  se referă la o formă solidă care arată ca o piramidă cu
            vârful tăiat paralel cu baza.
            Aceasta este forma regiunii care poate fi văzută și redată de o cameră în perspectivă.
            Orice lucru care cade în afara liniilor divergente de la marginile imaginii nu va fi vizibil pentru cameră,
            in plus orice altceva mai aproape de cameră decât planul de decupare apropiat
            și orice altceva mai departe decât planul de decupare îndepărtat nu va fi redat.


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
            In cazul specific renderer este o functie care genereaza o imagine mai mult sau mai putin fotorealistica
            in un element din DOM.
         */

        renderer: new THREE.WebGLRenderer(),

        /*
            Mesh sunt obiectele 3D care pot fi adaugati unei scenei.
            Aceste obiecte sunt facute de niste geometrii (forme) si de materiale.
            Materiale sunt facute de coloare, textura si efectele de lumina.
         */


        /*
            Aici creez planul unde este plasat cubul.
         */

        plane: new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshLambertMaterial({color: 0xcccccc})
        ),

        /*
            Aici specific detalile pentru a genera Cubul.
            BoxGeometry reprezinta o clasa de geometrie pentru crearea o forma care arata ca un cub
            rectangular cu latime, inaltime si profunzime.
         */

        cube: new THREE.Mesh(
            new THREE.BoxGeometry(6, 6, 6),
            new THREE.MeshLambertMaterial({
                color: 0xbdbdbd,
                map: new THREE.TextureLoader().load("https://i.imgur.com/czwKR1q.jpg"),
            })
        ),

        /*
            E un tip de lumina uniforme care ilumineza scena in fel uniform.
            Acesta lumina nu poate fi folosita pentru a desemna umbrele fiindca nu are o directie.
         */

        ambient: new THREE.AmbientLight(0xffffff, 0.3),

        /*
            E un tip de lumina care se duce catre o specifica directie si poate crea umbre.

            Sursele de lumina, indiferent de ce tip sunt, se cumuleaza.
         */

        light: new THREE.DirectionalLight(0xffffff, 1),


        /*
            Acest obiect contine parametri initiali folositi de utilitate DAT (in partea drapta superioare a ecranului)
            pentru a schimba in timp real culoarile, etc a unui obiect.
         */

        control: {
            color: 0xbdbdbd
        },


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
    control,
} = state;


/*
    Renderer este o functie care creaza un element din DOM astfel in cat poate fi adaugat unei pagini web.
    Acest rendereer poate folosi WEBGL, canvas, CSS3.
    In cazul specific renderer este o functie care genereaza o imagine mai mult sau mai putin fotorealistica
    in un element din DOM.
 */

function buildRenderer() {
    /*
    Corecția gamma, sau adesea pur și simplu gamma, este o operație neliniară utilizată pentru codificarea
    și decodarea luminanței în sistemele de imagine.
    */
    renderer.gammaOutput = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/*
    Dupa ce un obiect a fost generat mai sunt unele aspecte care trebuie specificate despre pozitia lui si cum arata
    (unghiu).
 */

function buildPlane() {
    /*
     Unitatile de masura folosite din ThreeJS sunt cele din Sistemul International.
     https://github.com/mrdoob/three.js/issues/6259

     In consecinta pentru unghiurile se folosesc radians, unghiurile lui Euler.
     1 pi rad =  180 grade

     -0.5pi = -90 grade

     1 rad = 57.3 grade

     -0.5 x 3.14 * 57.3 grade = 90 grade

     Translatie

      [ x' ]   [ 1   0        0        Tx ]     [  x ]
      | y' | = | 0   1        0        Ty |  x  |  y ]
      | z' |   | 0   1        1        Tz |     |  z ]
      [ 1' ]   [ 0   0        0        1 ]      [  1 ]

      x' = x + Tx
      y' = y + Ty
      z; = z + Tz

      Rotatie

      Dacă vrem să rotim o figură în jurul axei x, atunci componenta x va remane
      la fel, si o sa aplicam niste formule trigonometrice pe componentele y si z
      care vin de la unghiurile lui Euler.

      Scalare

      Multim fiecare componenta x, y, z cu un scalar.

      x' = Sx * x;
      y' = Sy * y;
      z' = Sz * z;


     */
    plane.rotateX(-0.5 * Math.PI);
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
}

function buildLight() {
    /*
        Position este un Vector3 care reprezinta pozitie locala a obiectului.
        Implicit este (0, 0, 0).

     */

    light.position.set(10, 20, 20);
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

        /*
            Aici construiesc niste "mingi", pentru acest scop, pentru fiecare, trebuie sa creeez 3 obiecte care raprezinta
            istantele a 3 clase:
            DodecahedronGeometry (acesta reprezinta o forma)
            MeshLambertMaterial
            Mesh
            Mesh sunt obiectele 3D care pot fi adaugati unei scenei.
            Aceste obiecte sunt facute de niste geometrii (forme) si de materiale.
            Materiale sunt facute de coloare, textura si efectele de lumina.
         */

        const geometry = new THREE.DodecahedronGeometry(2, 0);

        const material = new THREE.MeshLambertMaterial({
            color: 0x3483f,
            /*
                Maparea texturilor este fundamentală pentru crearea de randări realiste, iar hardware-ul a unitatei de procesare
                grafica conține unități de textură pentru a sprijini maparea texturilor.
                O unitate de textură efectuează procesarea pentru maparea texturilor.
                Un obiect de textură stochează datele necesare pentru maparea texturilor.
                Împreună, o unitate de textură și un obiect de textură pot efectua maparea texturilor într-un shader.
                Putem crea oricâte obiecte de textură dorim, dar numărul de unități de textură din unitate de procesare grafica
                determină câte mape de textură putem utiliza simultan într-un shader.
                Coordonatele de textura se afla in intervalul 0 si 1.
            */
            map: new THREE.TextureLoader().load("https://i.imgur.com/czwKR1q.jpg"),
        });
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

    /*
       Pentru a aplica o transformare scalara asupra un obiect putem folosi scale.set()
       Unitatile de masura folosite din ThreeJS sunt cele din Sistemul International.
       https://github.com/mrdoob/three.js/issues/6259
     */

    cube.scale.set(0.5, 0.5, 0.5);


    /*
       Pentru a rota obiectele putem folosi functile rotateX, rotateY, si rotateZ
       Functile primesc radians.
    */

    cube.rotateZ(-0.25 * Math.PI);

    scene.add(plane);
    scene.add(cube);
    camera.lookAt(scene.position);
    scene.add(ambient);
    scene.add(light);

    addControlGui(control);

    const container = document.getElementById("app");
    container.appendChild(renderer.domElement);
    const resizeHOF = ({camera, renderer}) => event =>
        handleResize({camera, renderer});

    /*
    Astea sunt functile care contin codul folosit din ascultatoari de evenimente curespunzatoare.
    Acesti ascultatori sunt oferiti din dom si ne permit sa executam niste actiuni in momentul in care se verifica un eveniment.
    Ascultatori de evenimente sunt atasati din dezvoltatorul pe elementele dorite din DOM.
    Un event trece prin 3 faze:

    - Event capturing: faza in care un eveniment este capturat dar inca nu a ajuns la target.
    - Event target: eveniment a juns la target.
    - Event bubbling: evenimentul sare prin lansul de elementele a DOM-ului si in acesta faza poate fi capturat si din
    elementele care reprezinta copiilor a elementului pe care ascultatorul a fost plasat.
 */


    /*
        Aici folosesc o asa numita Higher Order Function, adica o functie de ordin superior: aceasta idee se lega de partial
        evaluation si ne ajuta sa micsoram numarul de parametrelor care primeste o functie.
        De fapt, browser-ul se astepta o functie de callback in care singur parametru va fi evenimentul.
        Ex.:
        function functie(event) {
            console.log(event);
        }
        Totusi, noi avem nevoie sa iniectam parametri da care noi avem nevoie la randul nostru.
        Atunci partial computation vine in ajutorul nostru.
        Norocul este ca Javascript foloseste scope-ul lexical, adica: o variabila declarata intre o functie parinte
        este vizibila in interiorul unei functi imbricata.
        Ex.
        function functie(ceva) {
            return function(altceva) {
                console.log(ceva);
            }
        }

     */
    /*
        Resize se refera la redimensionarea obiectului Window.
     */
    window.addEventListener("resize", resizeHOF({camera, renderer}), false);

    /*
        Renderer este o functie care creaza un element din DOM astfel in cat poate fi adaugat unei pagini web.
        Acest rendereer poate folosi WEBGL, canvas, CSS3.
        In cazul specific renderer este o functie care genereaza o imagine mai mult sau mai putin fotorealistica
        in un element din DOM.
     */

    render({scene, renderer, camera});
}

/*
    Trebuie sa dam mai departe un obiect de configurare catre libreria Dat (cea care ne ofera menu in partea dreapta
    a ecranului.
    Pentru a configura istanta obiectului este necesar sa specificam cheia proprietati prin un sir ca al doilea parametru
    din functile add si addColor().
 */
function addControlGui(controlObject) {
    const gui = new dat.GUI();
    gui.addColor(controlObject, "color");
}


// let time = performance.now();

function render({scene, renderer, camera}) {

    scene.getObjectByName("cube").material.color = new THREE.Color(control.color);

    /*
        Este o alternativa mai eficienta in loc de
        setInterval(function() {
            // animiate something
        }, 1000/60);

        Unu intre avantaje este ca animatia se opreste cand schimbam tab in browser.

        A fost introdus recent intre functile din api-ul browserului.

     */

    requestAnimationFrame(() =>
        render({scene, renderer, camera})
    );



    // console.log(performance.now() - time)
    //
    // if(Math.floor(performance.now() - time) <=1500) {
    //     const vector = direction.clone().multiplyScalar(speed);
    //     for (const s of spheres) {
    //         s.position.x = s.position.x + vector.x;
    //         s.position.y = s.position.y + vector.y;
    //         s.position.z = s.position.z + vector.z;
    //     }
    // }


    renderer.render(scene, camera);

}

function handleResize({camera, renderer}) {
    camera.aspect = window.innerWidth / window.innerHeight;

    /*
        Matricea de proiecție pentru a transforma coordonatele de vizualizare în coordonatele clipului ia de obicei
        două forme diferite în care fiecare formă își definește propriul frustum unic.
        Frustrum este trunchiul unei forme geometrice solide.
        Putem crea fie o matrice de proiecție ortografică, fie o matrice de proiecție în perspectivă.
     */


    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function move() {
    console.log("testttttttt");
    /*
        Clone returneaza un nou obiect de tip vector3 cu aceasi valoarile (x,y,z)
        ca si obiectului pe care a fost apelat.
        multiplyScalar multeste un vector cu un scalar.

     */
    const vector = direction.clone().multiplyScalar(speed);
    /*

    Folosirea lui RXJS nu este obligatorie in cazul specific totusi am vrut sa il folosesc
    pentru ca observabile sunt des intalnite.


    Observabile sunt un ADT, abstract data type, care este compus de o multime de valori si de niste operatori
    care pot manipula acestora.
    Mai specific cand vorbim de Observabile ne referim la o serie de elemente (observabile) care sunt emise in un timp anume.
    Diferenta intre un observable si un promise este ca un observable nu este mai active atunci cand folosim operatorul
    .unsubscribe(), insa un promise nu este mai active din momentul in care a fost executata fie functie resolve() fie
    functie reject().


    Un Scheduler este o structura de date pentru a memora si a pune in unei cozi taskurile pe baza unei prioritati sau alte
    criterile. Un scheduler are un ceas virtual care este folosit pentru a urmari timpul si prin metoda performance.now().
    Daca este folosit un browser mai vec atunci se foloseste Date.now().

    AnimationFrameScheduler programeaza o sarcina (task) astfel in cat sa se intample inainte de a desena continutul din nou pe ecran.


   */

    /*
        Pipe este un operator care permite de a efectua o operatiune de "left fold": https://wiki.haskell.org/Fold
         in care functile sunt executate din stanga la dreapta si rezultatul fiecaruia este furnizat ca si inputul functiei urmatoare.
         https://github.com/ReactiveX/rxjs/blob/master/src/internal/util/pipe.ts
     */

    interval(0, animationFrameScheduler)
        .pipe(
            takeUntil(timer(3000)),
            tap(y => {
                console.log("y is:", y);
                for (const s of spheres) {
                    s.position.x = s.position.x + vector.x;
                    s.position.y = s.position.y + vector.y;  // vector.y = -1 * 0.05 (speed)
                    s.position.z = s.position.z + vector.z;
                }
            })
        )
        .subscribe();

}

init();
move();

