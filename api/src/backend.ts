import { TSignedRequest } from "@turnkey/http";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import { forwardAlchemyRequest } from "./alchemyRpc";
import { ALLOWED_ORIGIN } from "./constants";
import { handleErrors, handleErrorsForJsonRpc } from "./errors";
import { JsonRpcRequest } from "./jsonRpc";
import createSubOrg from "./turnkey/createSubOrg";
import login from "./turnkey/login";
import { CreateSubOrgWithPrivateKeyRequest } from "./turnkey/types";

export default express()
  .use(cors({ origin: ALLOWED_ORIGIN }))
  .use(express.json())
  .use(morgan("tiny"))
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
  )
  .post(
    "/rpc",
    handleErrorsForJsonRpc(async (req, res) => {
      const body: JsonRpcRequest<any[]> = req.body;
      const response = await forwardAlchemyRequest(body);
      res.send(response);
    })
  );
