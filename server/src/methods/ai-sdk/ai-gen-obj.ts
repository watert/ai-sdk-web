import { streamObject, StreamObjectResult } from "ai";
import { AiGenTextStreamOpts, prepareAiSdkRequest } from "./ai-gen-text";
import _ from "lodash";

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