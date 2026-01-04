import { requestUIMessageStream, streamToAiStreamHandler, type RequestAiStreamState } from "@/models/requestUIMessageStream";
import { useAsyncSubscriberFn } from "./useAsyncSubscriber";
import { useRef, useState } from "react";
import { type RequestAIStreamReturn, requestAIStream } from "@/models/requestAIStream";
import { useAsyncFn } from "react-use";

export type AiStreamConfig = {
  url?: string; baseUrl?: string;
  platform?: string; model?: string; system?: string;
}

type DefaultStreamFuncParams = {
  platform?: string; model?: string; system?: string;
  prompt?: string; url?: string; body?: Record<string, any>;
}

export function useAiStreamFn({ url, baseURL, platform, model, system }: {
  url?: string; baseURL?: string;
  platform?: string; model?: string; system?: string;
}): [
  state: { value: RequestAIStreamReturn, loading: boolean, error?: any },
  send: (body: DefaultStreamFuncParams) => void,
  abort: () => void,
] {
  const [state, onChange] = useState<RequestAIStreamReturn>({
    parts: [], text: '', id: '', role: 'assistant',
  });
  const abortRef = useRef<AbortController>(null);
  const resp = useAsyncFn(async (body: any) => {
    abortRef.current?.abort?.();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const params = { baseURL, onChange, signal, };
    const finalBody = { platform, model, system, ...body };
    const final = await requestAIStream(url, finalBody, params);
    onChange(final);
  // return send(params);
  }, [url, platform, model, system]);
  const finalState = { ...resp[0], value: state };
  return [finalState, resp[1], () => abortRef.current?.abort?.()];
}


export function useAiStream<StateType = RequestAiStreamState, T = DefaultStreamFuncParams>(config: AiStreamConfig):[
  state: { value: StateType, loading: boolean, error?: any },
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
  const loading = state?.status === 'streaming';
  const resp = useAsyncFn(async (params?: T) => {
    const finalState = await send(params);
    return finalState as any;
  }, [send]);
  return [{ ...resp[0], loading, value: state as any }, resp[1], abort];
}