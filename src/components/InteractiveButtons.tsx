import React from 'react';
import { useSocket } from '../hooks/useSocket';
import socketService from '../services/socketService';
import './InteractiveButtons.css';

const InteractiveButtons: React.FC = () => {
  const { roomState, sendButtonPress, isActive, position } = useSocket();
  
  const getButtonMessage = (buttonIndex: number) => {
    const activeCount = roomState.activeUsers.length;
    return `${activeCount}-${position}-${buttonIndex}`;
  };

  if (!isActive) {
    return (
      <div className="waiting-room">
        <h2>Waiting Room</h2>
        <p>Position in queue: {roomState.waitingUsers.findIndex(user => user.id === socketService.socketId) + 1}</p>
        <p>Active users: {roomState.activeUsers.length}/{roomState.maxActiveUsers}</p>
      </div>
    );
  }

  return (
    <div className="interactive-buttons">
      <div className="status">
        <h2>Active User</h2>
        <p>Your position: {position}</p>
        <p>Total active users: {roomState.activeUsers.length}</p>
      </div>
      <div className="buttons-grid">
        {[1, 2, 3, 4].map((buttonIndex) => (
          <button
            key={buttonIndex}
            onClick={() => sendButtonPress(getButtonMessage(buttonIndex))}
            className="interactive-button"
          >
            Button {getButtonMessage(buttonIndex)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InteractiveButtons;
