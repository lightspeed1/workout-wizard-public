const str = "ord422@a";
const regex = /[0-9]{2,}.*/;
const r1 = /q(?=.*u)/;
const r2 = /(?=.*[0-9]{2,})(?=.*[!@#$%^&*])(?=.{8,16})/;
console.log(str.match(r2));