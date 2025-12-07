import React from 'react';
import NoteBlockCard from '../components/NoteBlock';
import type { NoteBlock, IdeaType } from '../components/NoteBlock';

const NoteBlockDebugPage: React.FC = () => {
  // Mock data for NoteBlock components
  const mockNoteBlocks: Partial<NoteBlock>[] = [
    {
      id: 'debug-1',
      ideaType: 'writing' as IdeaType,
      title: 'AI写作助手的未来发展方向',
      content: '探索AI在创意写作、内容生成和文学创作领域的应用潜力，分析当前技术的局限性和未来可能的突破点。',
      actions: ['生成大纲', '扩展内容', '改写'],
      comments: '这是一个关于AI写作的初步构思'
    },
    {
      id: 'debug-2',
      ideaType: 'research' as IdeaType,
      title: '大语言模型的数学原理研究',
      content: '深入分析Transformer架构的数学基础，包括自注意力机制、位置编码和残差连接等核心概念。',
      actions: ['生成数学公式', '可视化模型', '导出PDF']
    },
    {
      id: 'debug-3',
      ideaType: 'analyze' as IdeaType,
      title: '用户行为数据分析报告',
      content: '基于最近30天的用户行为数据，分析用户活跃度、使用时长和功能偏好等关键指标。',
      actions: ['生成图表', '导出数据', '生成结论']
    },
    {
      id: 'debug-4',
      ideaType: 'knowledge' as IdeaType,
      title: 'React Hooks 核心概念总结',
      content: '总结React Hooks的核心概念和使用方法，包括useState、useEffect、useContext等常用Hook的原理和最佳实践。',
      actions: ['生成示例代码', '创建思维导图', '导出文档']
    },
    {
      id: 'debug-5',
      ideaType: 'writing' as IdeaType,
      title: '科幻小说：未来的城市',
      content: '在2150年的未来城市中，人类与AI和谐共存，城市建筑能够自我修复，交通系统实现全自动化。',
      actions: ['继续创作', '生成角色', '创建世界观']
    }
  ];

  const handleAction = (block: NoteBlock, action: string) => {
    console.log('Action clicked:', action, 'on block:', block);
    alert(`执行动作: ${action} 于 ${block.title}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">NoteBlock 调试页面</h1>
      <div className="space-y-4">
        {mockNoteBlocks.map((block, index) => (
          <NoteBlockCard
            key={block.id || `mock-${index}`}
            block={block}
            conversationId="debug-conversation"
            messageId="debug-message"
            index={index}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
};

export default NoteBlockDebugPage;