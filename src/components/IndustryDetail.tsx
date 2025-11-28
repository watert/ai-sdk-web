import React from 'react';
import type { IndustryTagInfo } from '../data/industry-data';

interface IndustryDetailProps {
  industry: IndustryTagInfo;
}

const IndustryDetail: React.FC<IndustryDetailProps> = ({ industry }) => {
  return (
    <div className="industry-detail">
      <h1>{industry.name} ({industry.name_en})</h1>
      <p className="industry-desc">{industry.desc}</p>
      
      <section className="industry-section">
        <h2>相关标签</h2>
        <div className="tag-list">
          {industry.tags.map((tag: string, index: number) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </section>
      
      <section className="industry-section">
        <h2>受众描述</h2>
        <p>{industry.audienceDesc}</p>
      </section>
      
      <section className="industry-section">
        <h2>受众标签</h2>
        <div className="tag-list">
          {industry.audienceTags.map((tag: string, index: number) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </section>
      
      <section className="industry-section">
        <h2>受众MBTI类型</h2>
        <div className="tag-list">
          {industry.audienceMbtis.map((mbti: string, index: number) => (
            <span key={index} className="tag mbti-tag">{mbti}</span>
          ))}
        </div>
      </section>
      
      <section className="industry-section">
        <h2>女性受众比例</h2>
        <div className="female-rate">
          <div className="rate-bar">
            <div 
              className="rate-fill" 
              style={{ width: `${industry.audienceFemaleRate}%` }}
            ></div>
          </div>
          <span className="rate-value">{industry.audienceFemaleRate}%</span>
        </div>
      </section>
    </div>
  );
};

export default IndustryDetail;