import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";

import { forwardAlchemyRequest } from "./alchemyRpc";
import {
  ALCHEMY_API_BASE_URL,
  ALCHEMY_API_KEY,
  ALLOWED_ORIGIN,
} from "./constants";
import { handleErrorsForJsonRpc } from "./errors";
import { JsonRpcRequest } from "./jsonRpc";

export default express()
  .use(cors({ origin: ALLOWED_ORIGIN }))
  .use(morgan("tiny"))
  .post(
    "/rpc",
    express.json(),
    handleErrorsForJsonRpc(async (req, res) => {
      const body: JsonRpcRequest<any[]> = req.body;
      const response = await forwardAlchemyRequest(body);
      res.send(response);
    })
  )
  .use(
    "/signer",
    createProxyMiddleware({
      target: ALCHEMY_API_BASE_URL,
      changeOrigin: true,
      headers: { Authorization: `Bearer ${ALCHEMY_API_KEY}` },
    })
  );
