import React from 'react';
import { useParams } from 'react-router-dom';
import { industryData } from '../data/industry-data';
import IndustryDetail from '../components/IndustryDetail';

const IndustryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const industry = industryData.find(ind => ind.id === id);

  if (!industry) {
    return <div className="industry-not-found">未找到该行业信息</div>;
  }

  return <IndustryDetail industry={industry} />;
};

export default IndustryDetailPage;