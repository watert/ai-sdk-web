import React from 'react';
import type { IndustryTagInfo } from '../data/industry-data';
import { getMBTIById } from '../data/mbti';

interface IndustryDetailProps {
  industry: IndustryTagInfo;
}

const IndustryDetail: React.FC<IndustryDetailProps> = ({ industry }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {industry.emoji} {industry.name} ({industry.name_en})
      </h1>
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">{industry.desc}</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">相关标签</h2>
        <div className="flex flex-wrap gap-2">
          {industry.tags.map((tag: string, index: number) => (
            <span key={index} className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">受众描述</h2>
        <p className="text-gray-700">{industry.audienceDesc}</p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">受众标签</h2>
        <div className="flex flex-wrap gap-2">
          {industry.audienceTags.map((tag: string, index: number) => (
            <span key={index} className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">受众MBTI类型</h2>
        <div className="flex flex-wrap gap-2">
          {industry.audienceMbtis.map((mbti: string, index: number) => {
            const mbtiInfo = getMBTIById(mbti);
            return (
              <span key={index} className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                {mbtiInfo?.emoji} {mbti} - {mbtiInfo?.nickname}
              </span>
            );
          })}
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">女性受众比例</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${industry.audienceFemaleRate}%` }}
            ></div>
          </div>
          <span className="text-lg font-bold text-gray-800">{industry.audienceFemaleRate}%</span>
        </div>
      </section>
    </div>
  );
};

export default IndustryDetail;