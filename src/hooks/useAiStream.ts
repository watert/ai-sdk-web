import { requestUIMessageStream, streamToAiStreamHandler, type RequestAiStreamState } from "@/models/requestUIMessageStream";
import { useAsyncSubscriberFn } from "./useAsyncSubscriber";

export type AiStreamConfig = {
  url?: string; baseUrl?: string; platform?: string;
  model?: string; system?: string;
}


type DefaultStreamFuncParams = {
  platform?: string; model?: string; system?: string;
  prompt?: string; url?: string; body?: Record<string, any>;
}

export function useAiStream<StateType = RequestAiStreamState, T = DefaultStreamFuncParams>(config: AiStreamConfig):[
  state: StateType,
  send: (params?: T) => void,
  abort: () => void,
] {
  const { url: defaultUrl, baseUrl, platform = 'OLLAMA', model, system } = config;
  const handler = useAsyncSubscriberFn(async (params?: T) => {
    const { url = defaultUrl, prompt, body = {} } = params || ({} as any);
    if (!prompt || !url) { throw new Error('prompt is required'); }

    const controller = new AbortController();
    const stream = await requestUIMessageStream({
      baseUrl, url, signal: controller.signal,
      body: { platform, model, system, prompt, ...body },
    });
    return streamToAiStreamHandler({
      stream, abortController: controller,
      onFinish: (state) => {
        console.log('onFinish', state);
      }
    });
  }, [platform, model, system]);
  const { state, send, abort } = handler;
  return [state as any, send, abort];
}