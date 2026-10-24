import React from 'react';
import { NotificationsModal as UnifiedModal } from '../../Farmer/Modals/NotificationsModal';

export const NotificationsModal = ({ isOpen, onClose, role = 'consumer' }) => {
  return (
    <UnifiedModal 
      isOpen={isOpen} 
      onClose={onClose} 
      role={role || 'consumer'} 
    />
  );
};
