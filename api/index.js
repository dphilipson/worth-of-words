/* eslint-disable @typescript-eslint/no-var-requires */
const serverless = require("serverless-http");
const backend = require("./dist/backend").default;

module.exports.handler = serverless(backend);
