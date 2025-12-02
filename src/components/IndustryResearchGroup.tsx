import React from 'react';
import InspirationItem, { type ResearchItem } from './InspirationItem';
import { Layers } from 'lucide-react';


export type ResearchGroupType = {
  title: string;
  summary: string; // 汇总总结, 50 字左右
  inspirations: ResearchItem[];
};

interface ResearchGroupProps {
  data: ResearchGroupType;
  onGenerate?: (params: { postIdea: string; inspiration: ResearchItem }) => void;
}

const ResearchGroup: React.FC<ResearchGroupProps> = ({ data, onGenerate }) => {
  return (
    <section className="mb-12 last:mb-0">
      <div className="flex items-start gap-4 mb-6">
        <div className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{data.title}</h2>
          <p className="text-slate-600 max-w-3xl leading-relaxed">
            {data.summary}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {data.inspirations.map((item, index) => (
          <InspirationItem 
            key={index} 
            data={item} 
            onGenerate={onGenerate}
            className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
          />
        ))}
      </div>
    </section>
  );
};

export default ResearchGroup;