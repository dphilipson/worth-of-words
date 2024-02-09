import { NextFunction, Request, Response } from "express";

import { JsonRpcErrorResponse } from "./jsonRpc";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function handleErrors(handler: AsyncHandler): AsyncHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error("Uncaught error in handler:", error);
      res.status(500).send(getErrorMessage(error));
    }
  };
}

export function handleErrorsForJsonRpc(handler: AsyncHandler): AsyncHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error("Uncaught error in JSON-RPC handler", error);
      const payload: JsonRpcErrorResponse = {
        jsonrpc: "2.0",
        id: req.body.id ?? null,
        error: { code: -32000, message: getErrorMessage(error) },
      };
      res.status(500).send(payload);
    }
  };
}

function getErrorMessage(error: any): string {
  const name = error?.name ?? "Error";
  const message = error?.message ?? "Internal Server Error";
  return `${name}: ${message}`;
}
