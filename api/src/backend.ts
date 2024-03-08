import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";

import { forwardAlchemyRequest } from "./alchemyRpc";
import { ALCHEMY_API_KEY, ALLOWED_ORIGIN } from "./constants";
import { handleErrorsForJsonRpc } from "./errors";
import { JsonRpcRequest } from "./jsonRpc";

export default express()
  .use(cors({ origin: ALLOWED_ORIGIN }))
  .use(morgan("tiny"))
  .use(
    "/signer",
    createProxyMiddleware({
      target: "https://api.g.alchemy.com",
      changeOrigin: true,
      headers: { Authorization: `Bearer ${ALCHEMY_API_KEY}` },
      onProxyRes: (proxyRes) => {
        // https://stackoverflow.com/a/66824870
        delete proxyRes.headers["transfer-encoding"];
      },
    })
  )
  .use(express.json())
  .post(
    "/rpc",
    handleErrorsForJsonRpc(async (req, res) => {
      const body: JsonRpcRequest<any[]> = req.body;
      const response = await forwardAlchemyRequest(body);
      res.send(response);
    })
  );
