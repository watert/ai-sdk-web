import React from 'react';
import type { ExtendedUIMessage } from './message-types.ts';
import { User } from 'lucide-react';
import { BaseTextMessageItem } from './BaseTextMessageItem';

interface UserMessageItemProps {
  message: ExtendedUIMessage;
  onEditSubmit?: (id: string, newContent: string) => void;
}

export const UserMessageItem: React.FC<UserMessageItemProps> = ({ 
    message, 
    onEditSubmit 
}) => {
  // User Avatar
  const userAvatar = (
    <div className={`
      flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm
      bg-blue-600 text-white
    `}>
      <User size={20} />
    </div>
  );

  return (
    <BaseTextMessageItem
      message={message}
      onEditSubmit={onEditSubmit}
      showEditButton={true}
      authorName="You"
      avatar={userAvatar}
      bubbleClasses="bg-blue-600 text-white rounded-tr-sm"
      containerClasses="flex-row-reverse"
    />
  );
};
