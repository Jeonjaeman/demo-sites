import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    return handler.fetch(request, env, context);
  },
};

export default worker;
