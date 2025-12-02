import React from 'react';
import { useAsync } from 'react-use';
import IndustryResearchGroup from '../components/IndustryResearchGroup';
import { getIndustryResearches, type IndustryResearchDoc, type IndustryResearchGroupData } from '../models/industry-research';


const IndustryResearchPage: React.FC = () => {
  // 使用useAsync获取行业研究列表数据
  const { value: researchesData, loading, error } = useAsync(async () => {
    return await getIndustryResearches({ 'data.industryId': 'ai' });
  }, []);

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
        console.log('mapping', data, researchesData)
        return <IndustryResearchGroup 
          key={data._id} researchData={data}
          data={convertToGroupData([data])[0]} 
        />;
      })}
    </div>
  );
};

export default IndustryResearchPage;