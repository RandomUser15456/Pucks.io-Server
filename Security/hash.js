const crypto = require('crypto');
require("dotenv").config();


const KEY = process.env.KEY;
const TOKEN_EXPIRY = 86400000; // 24 hours


function hashPassword(password) {
  return crypto.createHash('sha256').update(password + KEY).digest('hex');
}
//test
console.log("hashed password",hashPassword("ok"));

function generateToken() {
  let timeStamp = Date.now()
  let token = crypto.randomBytes(32).toString('hex') + "" + btoa(timeStamp);
  return {token,expires: timeStamp + TOKEN_EXPIRY,age: TOKEN_EXPIRY};
}
console.log(generateToken());

module.exports = { hashPassword, generateToken };