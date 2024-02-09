export interface JsonRpcRequest<T extends unknown[] = unknown[]> {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params: T;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: JsonRpcError;
}

export interface JsonRpcError<T = unknown> {
  code: number;
  message: string;
  data?: T;
}
