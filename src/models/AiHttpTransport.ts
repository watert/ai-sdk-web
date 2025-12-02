import _ from "lodash";
import { DefaultChatTransport, type HttpChatTransportInitOptions, type UIMessage } from "ai";
import { getAppReqHeaders } from "./appAxios";

export interface AiHttpTransportInit extends Omit<HttpChatTransportInitOptions<UIMessage>, 'api'> {
  api: string | (() => Promise<string> | string);
}
export function createAiHttpTransport(params: AiHttpTransportInit) {
  const { api } = params;
  return new DefaultChatTransport({
    headers: async () => getAppReqHeaders(),
    prepareSendMessagesRequest: async (_request) => {
      // console.log('prepare request', _request);
      // _.set(_request, 'api', typeof api === 'function' ? await api() : api)
      return { api: typeof api === 'function' ? await api() : api };
    },
    api: '/dev/ai-gen',
    ...params as any,
  });
}