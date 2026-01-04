import { Request, Response } from 'express';
import z from 'zod';
import _ from 'lodash';
import { StreamTextResult, ToolLoopAgent } from 'ai';
import { aiHandleUIMsgMetadata, getAISDKModel, prepareAiSdkRequest } from './ai-sdk-utils';
import { createAiStreamMiddleware } from '../../libs/stream-helper';

const isTruthy = (val) => val && !['false', '0', ''].includes(val.toString().trim().toLowerCase());

export let defaultModelConf: { platform: string; model?: string; } = {
  platform: 'OLLAMA'
};
export const defaultCallOptionsSchema = z.object({
  platform: z.string().optional(), model: z.string().optional(),
  search: z.boolean().optional(),
  thinking: z.boolean().optional(),
});
export async function prepareAiCallOptions(options: any) {
  const data = await prepareAiSdkRequest({ ...defaultModelConf, ...options?.options || {} });
  const finalOpts = {
    ..._.omit(options, 'options'),
    ..._.omit(data.params, 'search', 'thinking'),
  };
  return finalOpts;
}

// export const testAgent = new ToolLoopAgent({
//   model: getAISDKModel(defaultModelConf).model,
//   instructions: '你尖酸刻薄, 回答简短精炼',
//   callOptionsSchema: defaultCallOptionsSchema,
//   prepareCall: prepareAiCallOptions as any,
//   tools: {},
// });
// testAgent.stream
export type AiAgentConf = {
  platform?: string; model?: string; system?: string; tools?: any;
  onFinish?: (params: { result: StreamTextResult<any, any>, req?: Request, res?: Response }) => any;
}
export function createAiAgent(params: AiAgentConf) {
  if (typeof params === 'string') {
    params = { system: params };
  }
  const { platform, model, system, tools } = { ...defaultModelConf, ...params };
  return new ToolLoopAgent({
    model: getAISDKModel({ platform, model }).model,
    callOptionsSchema: defaultCallOptionsSchema,
    prepareCall: prepareAiCallOptions as any,
    instructions: system, tools,
  });
}

export function isAiAgent(obj: any): boolean;
export function isAiAgent(agent: ToolLoopAgent): boolean {
  return (agent.version === 'agent-v1' && !!agent.stream);
}

export type AgentMap = Record<string, AiAgentConf | string>;
export const testAgents: AgentMap = {
  'lean': createAiAgent({ system: '犀利而概括' }),
  'critical': '批判性思考者', // just text
}
export function getAgent(name: string, agents = testAgents) {
  let agentConf = agents[name], agent: ToolLoopAgent<any> | undefined;
  if (typeof agentConf === 'string') {
    agentConf = createAiAgent({ system: agentConf });
  }
  if (typeof agentConf === 'object' && !(agentConf as any)?.stream) {
    agent = createAiAgent(agentConf as AiAgentConf);
  }
  if (!agent) {
    console.log('AgentNotFoundError: agent:', agent, 'name:', name, 'agents:', agents);
    throw new Error(`Agent '${name}' not found`);
  }
  return { agent: agent as ToolLoopAgent<any>, agentConf };
}

export function createAgentsMiddleware(agents = testAgents) {
  return createAiStreamMiddleware(async (body, { req, res, signal }) => {
    const { agentName } = req.params;
    const { prompt, messages, format, stream: enableStream = true, ...options } = body;
    const { agent, agentConf } = (await getAgent(agentName, agents));
    const args = {
      ...(prompt ? { prompt }: { messages }), options
    };
    if (format === 'text') {
      const { textStream } = (await agent.stream(args));
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      for await (const chunk of textStream) { res.write(chunk); }
      res.end();
      // return { $type: 'text/markdown', content: textStream};
    }
    if (!isTruthy(enableStream)) {
      const resp = await agent.generate(args);
      return resp.content;
    }
    const resp = await agent.stream(args);
    if (agentConf.onFinish) {
      resp.content.then(() => {
        agentConf?.onFinish?.({ result: resp, req, res });
      });
    }
    return resp.toUIMessageStream({
      messageMetadata: aiHandleUIMsgMetadata,
    });
  });
}