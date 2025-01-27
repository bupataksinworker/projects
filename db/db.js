require('dotenv').config();

const { MG_USERNAME, MG_PASSWORD, MG_HOSTNAME, MG_DATABASE } = process.env;
const dbUrl = `mongodb://${MG_USERNAME}:${MG_PASSWORD}@${MG_HOSTNAME}/${MG_DATABASE}`;

// const { MONGODB_URL } = process.env;
// const dbUrl = MONGODB_URL;

module.exports = dbUrl;
// console.log(process.env)