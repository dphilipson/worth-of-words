import express from "express";

export default express().get("/say-hello", (_req, res) => {
  const name = _req.query["name"] ?? "World";
  res.json({ message: `Hello, ${name}!` });
});
