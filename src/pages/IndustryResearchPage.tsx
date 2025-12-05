import React, { useMemo, useState, useEffect } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import IndustryResearchGroup from '../components/IndustryResearchGroup';
import { type IndustryResearchConfig, type IndustryResearchDoc, type IndustryResearchGroupData } from '../models/industry-research';
import { appAxios } from '@/models/appAxios';
import _ from 'lodash';
import { _set } from '@/libs/_set';
import { requestUIMessageStream } from '@/models/requestUIMessageStream';
import { toast } from 'sonner';


export type IndustryResearchQueryParams = {
  page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
  'data.industryId'?: string; [key: string]: any;
};

export type IndustryResearchListResponse = { total: number; count: number; data: IndustryResearchDoc[]; };

/**
 * 获取行业研究列表
 * @param params 查询参数
 * @returns 行业研究列表数据
 */
export const getIndustryResearches = async (
  params: IndustryResearchQueryParams
): Promise<IndustryResearchListResponse> => {
  const response = await appAxios.get<IndustryResearchListResponse>(
    '/industry/researches',
    { params }
  );
  return response.data;
};

type PromiseHandlerResp = Promise<any> & { resolve: (ret: any) => void, reject: (err: any) => void }
function createPromiseHandler(): PromiseHandlerResp {
	let defer;
	const promise = new Promise((resolve, reject) => {
	  defer = { resolve, reject };
	});
	return Object.assign(promise, defer);
}

const IndustryResearchPage: React.FC = () => {
  // 使用useAsyncFn获取行业研究列表数据
  const industryId = 'ai';
  const [{ loading, error, value: _researchesData }, fetchDocs] = useAsyncFn(async () => {
    return await getIndustryResearches({ 'data.industryId': industryId });
  }, [industryId]);

  // 初始化调用获取行业研究列表数据
  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  const { value: { defaultConfigs } = {} } = useAsync(async () => {
    const resp = await appAxios.get('/dev/industry-research/info')
    return resp.data?.data as {
      defaultConfigs: IndustryResearchConfig[]
    };
  });
  const [streamJson, setStreamJson] = useState<any>();
  const researchesData = useMemo(() => {
    if (!_researchesData?.data || !defaultConfigs) {
      return undefined;
    }
    const dataByCalId = _.keyBy(_researchesData.data, 'calendarId');
    const configById = _.keyBy(defaultConfigs, c => `${industryId}--${c.id}`);
    const configDocs = defaultConfigs.map((config: IndustryResearchConfig) => {
      const calendarId = `${industryId}--${config.id}`
      const doc = dataByCalId[calendarId];
      const data = { ...doc?.data, config };
      return { calendarId, doc, data, rule: config.repeatRule };
    }).filter((r: any) => !r.doc) as IndustryResearchDoc[];
    let ret = _researchesData;
    if (streamJson) {
      const { metadata = {}, ...json } = streamJson || {};
      const docIdx = ret.data.findIndex(r => r.calendarId === metadata.calendarId);
      ret = _set(ret, `data[${docIdx}].data.json`, () => json);
    }

    return _set(ret, 'data', (prev: IndustryResearchDoc[]) => {
      let data = _.uniqBy([...prev, ...configDocs], (r: IndustryResearchDoc) => r.calendarId)
      data = data.map(row => {
        const config = configById[row.calendarId];
        if (!row.rule) { row = _set(row, 'rule', config?.repeatRule); }
        return row;
      });
      data = _.sortBy(data, (r: IndustryResearchDoc) => defaultConfigs.indexOf(configById[r.calendarId]));
      return data;
    });
  }, [industryId, _researchesData, streamJson, defaultConfigs])
  console.log('research page', {researchesData, defaultConfigs});

  // 将API返回的数据转换为组件所需的格式
  const convertToGroupData = (docs: IndustryResearchDoc[]) => {
    // 这里可以根据实际业务需求转换数据格式
    // 目前使用mock数据的结构作为示例
    return docs.map((row: IndustryResearchDoc) => {
      return {
        title: row.data.config?.title,
        ...row.data.json! as any
      };
    }) as IndustryResearchGroupData[];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">行业研究报告</h1>
      
      {loading && <div className="text-center py-12">加载中...</div>}
      
      {error && <div className="text-center py-12 text-red-500">加载失败：{error.message}</div>}
      
      {researchesData?.data && researchesData.data.map(data => {
        return <IndustryResearchGroup 
          key={data._id} researchData={data}
          data={convertToGroupData([data])[0]}
          onGenerate={async () => {
            let toastPromise: PromiseHandlerResp | undefined, fetch: any;
            const body = {
              thinking: true, industryId, local: true,
              config: data.data.config as IndustryResearchConfig,
              force: true,
            };
            // console.log('fetch body', body);
            fetch = (await import ('@/pages/mockSseChunks')).fetchMockSse;

            const resp = await requestUIMessageStream({
              url: '/api/dev/industry-research', fetch, body,
              onChange: (state) => {
                if (_.get(state, 'messages.0.metadata.status') === 'skip') {
                  console.log('call toast info');
                  toast.info('已跳过');
                  // return;
                }
                const allParts = _.flatMap(state.messages, 'parts');
                const reasoningIndex = _.findLastIndex(allParts, r => r.type === 'reasoning');
                const isThinking = reasoningIndex !== -1 && reasoningIndex === allParts.length - 1;
                if (isThinking && !toastPromise) {
                  toastPromise = createPromiseHandler();
                  toast.promise(toastPromise, { loading: '思考中...', success: '思考完成' });
                } else if (!isThinking && toastPromise) {
                  toastPromise.resolve(state);
                  toastPromise = undefined;
                }

                const { metadata } = _.last(state.messages) || {}
                if (state.json || isThinking) {
                  // setStreamJson(state.json);
                  setStreamJson({ ...state.json, metadata });
                  console.log('onchange Stream state.json', state, metadata)
                } else {
                  console.log('onchange Stream state:', state);
                }
              }
            });
            await resp.promise;
            // 重新拉取数据
            fetchDocs();
            // return new Promise(resolve => setTimeout(resolve, 1000));
          }}
        />;
      })}
    </div>
  );
};

export default IndustryResearchPage;