import { streamObject, StreamObjectResult } from "ai";
import _ from "lodash";
import { type AiGenTextStreamOpts, prepareAiSdkRequest } from "./ai-sdk-utils";

export type AiGenObjStreamOpts = AiGenTextStreamOpts & {}
export function aiGenObjStream<T=any>(opts: AiGenObjStreamOpts, ctx?: any): StreamObjectResult<any, T, any> {
  const { params, info } = prepareAiSdkRequest(opts, ctx);
  let context: any = {
    metadata: {},
    ...(opts.experimental_context as any) || {},
    ...opts.context,
  };
  const resp = streamObject({
    experimental_context: context,
    ..._.omit(params, 'search', 'thinking') as any,
  });
  return resp as any;
}