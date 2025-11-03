import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';

const SessionWarningModal = ({
  isOpen,
  timeLeft,
  onExtend,
  onLogout,
  timeLeftMs
}) => {
  const [currentTimeLeft, setCurrentTimeLeft] = useState(timeLeftMs);

  useEffect(() => {
    if (!isOpen || !timeLeftMs) return;

    setCurrentTimeLeft(timeLeftMs);

    const interval = setInterval(() => {
      setCurrentTimeLeft(prev => {
        const newTime = prev - 1000;
        return newTime <= 0 ? 0 : newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeftMs]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!isOpen) return null;

  const isUrgent = currentTimeLeft < 60000;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onExtend}
      />
      
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <AlertTriangle 
              className={`h-8 w-8 ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`} 
            />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session Expiring Soon
          </h2>
          <p className="text-gray-600 mb-4">
            Your session will expire due to inactivity.
          </p>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
            isUrgent ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-mono text-lg font-semibold">
              {formatTime(currentTimeLeft)}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Click anywhere on the page or press any key to extend your session automatically.
        </p>
      </div>
    </div>
  );
};

export default SessionWarningModal;