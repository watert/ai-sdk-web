import React, { useMemo } from 'react';
import { useAsync } from 'react-use';
import IndustryResearchGroup from '../components/IndustryResearchGroup';
import { getIndustryResearches, type IndustryResearchConfig, type IndustryResearchDoc, type IndustryResearchGroupData } from '../models/industry-research';
import { appAxios } from '@/models/appAxios';
import _ from 'lodash';
import { _set } from '@/libs/_set';
import { requestUIMessageStream } from '@/models/requestUIMessageStream';
import { toast } from 'sonner';


const IndustryResearchPage: React.FC = () => {
  // 使用useAsync获取行业研究列表数据
  const industryId = 'ai';
  const { value: _researchesData, loading, error } = useAsync(async () => {
    return await getIndustryResearches({ 'data.industryId': industryId });
  }, [industryId]);
  const { value: { defaultConfigs } = {} } = useAsync(async () => {
    const resp = await appAxios.get('/dev/industry-research/info')
    return resp.data?.data as {
      defaultConfigs: IndustryResearchConfig[]
    };
  });
  const researchesData = useMemo(() => {
    if (!_researchesData?.data || !defaultConfigs) {
      return undefined;
    }
    const dataByCalId = _.keyBy(_researchesData.data, 'calendarId');
    const configDocs = defaultConfigs.map(config => {
      const calendarId = `${industryId}--${config.id}`
      const doc = dataByCalId[calendarId];
      const data = { ...doc?.data, config };
      return { calendarId, doc, data, rule: config.repeatRule };
    }).filter(r => !r.doc) as IndustryResearchDoc[];
    return _set(_researchesData, 'data', (prev: IndustryResearchDoc[]) => {
      return _.uniqBy([...prev, ...configDocs], 'calendarId');
    });
  }, [industryId, _researchesData, defaultConfigs])
  console.log('research page', {researchesData, defaultConfigs});

  // 将API返回的数据转换为组件所需的格式
  const convertToGroupData = (docs: IndustryResearchDoc[]) => {
    // 这里可以根据实际业务需求转换数据格式
    // 目前使用mock数据的结构作为示例
    return docs.map(row => {
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
        // console.log('mapping', data, researchesData)
        return <IndustryResearchGroup 
          key={data._id} researchData={data}
          data={convertToGroupData([data])[0]}
          onGenerate={async () => {
            const resp = await requestUIMessageStream({
              url: '/api/dev/industry-research',
              body: {
                thinking: true, industryId, local: true,
                config: data.data.config,
                // force: true,
              },
              onChange: (state) => {
                if (_.get(state, 'messages.0.metadata.status') === 'skip') {
                  console.log('call toast info');
                  toast.info('已跳过');
                  // return;
                }
                if (state.json) {
                  console.log('onchange Stream state.json', state.json)
                } else {
                  console.log('onchange Stream state:', state);
                }
              }
            });
            await resp.promise;
            // return new Promise(resolve => setTimeout(resolve, 1000));
          }}
        />;
      })}
    </div>
  );
};

export default IndustryResearchPage;