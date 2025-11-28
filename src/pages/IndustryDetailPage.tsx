import React from 'react';
import { useParams } from 'react-router-dom';
import { industryData } from '../data/industry-data';
import IndustryDetail from '../components/IndustryDetail';
import type { EventDetails } from '../libs/CalendarEvent';
import EventListItem from '../components/EventListItem';

const IndustryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const industry = industryData.find(ind => ind.id === id);

  if (!industry) {
    return <div className="industry-not-found">未找到该行业信息</div>;
  }

  // 生成日历事件
  const generateCalendarEvents = () => {
    if (!industry.researchSchedules || industry.researchSchedules.length === 0) {
      return [];
    }

    return industry.researchSchedules.map((schedule) => {
      // 生成事件ID：行业ID + 研究ID
      const eventId = `${industry.id}-${schedule.id}`;
      
      // 生成事件详情
      const eventDetails: EventDetails = {
        id: eventId,
        title: schedule.title,
        description: schedule.prompt,
        startDateTime: schedule.startDateTime || new Date(),
        repeatRule: schedule.repeatRule,
      };

      return eventDetails;
    });
  };

  const calendarEvents = generateCalendarEvents();

  const handleEventSelect = (eventId: string) => {
    console.log('Selected event:', eventId);
    // 可以添加事件选择逻辑，比如导航到事件详情页
  };

  return (
    <div className="p-5 overflow-y-auto">
      {/* 先渲染事件卡片 */}
      {industry.enableResearch && calendarEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">研究日历事件</h2>
          <div className="grid gap-4">
            {calendarEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onSelect={handleEventSelect}
              />
            ))}
          </div>
        </section>
      )}
      
      {/* 然后渲染行业详情 */}
      <IndustryDetail industry={industry} />
    </div>
  );
};

export default IndustryDetailPage;