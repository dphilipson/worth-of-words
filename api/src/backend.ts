import { TSignedRequest } from "@turnkey/http";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";

import { ALLOWED_ORIGIN } from "./constants";
import createSubOrg from "./turnkey/createSubOrg";
import login from "./turnkey/login";
import { CreateSubOrgWithPrivateKeyRequest } from "./turnkey/types";

export default express()
  .use(cors({ origin: ALLOWED_ORIGIN }))
  .use(express.json())
  .use(morgan("tiny"))
  .get("/say-hello", (_req, res) => {
    const name = _req.query["name"] ?? "World";
    res.json({ message: `Hello, ${name}!` });
  })
  .post(
    "/create-sub-org",
    handleErrors(async (req, res) => {
      const body: CreateSubOrgWithPrivateKeyRequest = req.body;
      const details = await createSubOrg(body);
      res.send(details);
    })
  )
  .post(
    "/login",
    handleErrors(async (req, res) => {
      const body: TSignedRequest = req.body;
      const details = await login(body);
      res.send(details);
    })
  );

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

function handleErrors(handler: AsyncHandler): AsyncHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      const name = error?.name ?? "Error";
      const message = error?.message ?? "Internal Server Error";
      const fullMessage = `${name}: ${message}`;
      console.error(fullMessage);
      res.status(500).send(fullMessage);
    }
  };
}
