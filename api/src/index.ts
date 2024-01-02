import express from "express";
import serverless from "serverless-http";

const app = express().get("/say-hello", (_req, res) => {
  const name = _req.query["name"] ?? "World";
  res.json({ message: `Hello, ${name}!` });
});

export const handler = serverless(app);
