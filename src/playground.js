import {Observable} from "rxjs";

function Om(varsta, prenume, nume, inaltime) {

    this.varsta = varsta;
    this.prenume = prenume;
    this.nume = nume;
    this.inaltime = inaltime;

    this.iaVarsta = function () {
        return this.varsta;
    }

    this.iaPrenume = function () {
        return this.prenume;
    }

    this.isInaltime = function () {
        return this.inaltime;
    }

    this.iaNume = function () {
        return this.nume;
    }

}


function OmMuncitor(varsta, prenume, nume, inaltime) {

    Om.call(this, varsta, prenume, nume, inaltime);
    const tmp = () => {

        return "500 RON";
    }

    console.log("test", this);

    this.iaSalariu = tmp;
}


const om = new OmMuncitor(30, "Davide", "Pugliese", "1.67m");

console.log(om.iaSalariu());

console.log(om.varsta);


class Animal {

    constructor(nume, varsta, semnParticular) {
        this.nume = nume;
        this.varsta = varsta;
        this.semnParticular = semnParticular;
    }

    iaSemnParticular = () => {
        console.log("semn particular", this);
        return this.semnParticular;
    }

    iaNume = () => {

        console.log("ia nume", this);

        return () => {

            console.log("inner", this);
        }

    }

    iaVarsta = () => {
        return this.varsta;
    }


}


class Zebra extends Animal {

    constructor(nume, varsta, semnParticular) {
        super(nume, varsta, semnParticular);

    };

    zgomot = () => {

        return "AAaarg";
    }
}


function hello() {

    console.log("hello this", this);

    const a = new Animal("Animal", 5, "hello");


    console.log(a.iaNume());

    return {
        something: a.iaNume,
    }
}


const z = new Zebra("ZeBra", 10, "benzi");

console.log(z.iaNume());
console.log(z.iaVarsta());
console.log(z.iaSemnParticular());


console.log("-----1")
const test = hello().something();
test();
console.log("-----2")
console.log(hello().something()());


const a = new Observable(subscriber => {

    // subscriber.next("test");
    Observable.throw(new Error("cazz"));

});

a.subscribe(
    {
        next: value => {
            console.log(value)
        },
        error: value => {
            console.log("!!!!!!")
        },
        complete: value => {
            console.log("azzz")
        }
    });


setTimeout(()=> {
    console.log("oops");
}, 0);

const whatever = (fn=()=>{ console.log("default")}, time=500) => new Promise((rezolva, refuza)=>{
    {
        try {
            setTimeout(()=> {
                rezolva( fn());
            }, time)

        } catch (error) {
            refuza(new Error(error.message));
        }
    }
})

whatever(()=>{ console.log("oooooooo")}, 0);




