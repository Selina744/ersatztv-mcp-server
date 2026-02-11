import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

export function handleError(error: unknown): never {
  if (error instanceof McpError) {
    throw error;
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNREFUSED') {
      throw new McpError(
        ErrorCode.InternalError,
        `ErsatzTV is unreachable. Connection refused at ${error.config?.baseURL || 'unknown URL'}. Is the service running?`
      );
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new McpError(
        ErrorCode.InternalError,
        `ErsatzTV request timed out. The service may be overloaded or unreachable.`
      );
    }
    const status = error.response?.status;
    if (status) {
      throw new McpError(
        ErrorCode.InternalError,
        `ErsatzTV API returned HTTP ${status}: ${error.response?.statusText || 'Unknown error'}`
      );
    }
    throw new McpError(
      ErrorCode.InternalError,
      `ErsatzTV network error: ${error.message}`
    );
  }

  if (error instanceof Error) {
    throw new McpError(ErrorCode.InternalError, `Unexpected error: ${error.message}`);
  }

  throw new McpError(ErrorCode.InternalError, `Unknown error occurred`);
}
