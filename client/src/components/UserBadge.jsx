
import React from 'react';

const UserBadge = ({ user, isYou }) => {
  return (
    <div className="relative group">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
        isYou ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
      }`}>
        <div className={`h-2 w-2 rounded-full ${
          isYou ? 'bg-green-500' : 'bg-blue-500'
        }`} />
        <span className="font-medium">{isYou ? 'You' : user.charAt(0).toUpperCase()}</span>
      </div>
      
      {/* Tooltip with full name */}
      <div className="absolute hidden group-hover:block z-10 bottom-full mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap">
        {isYou ? 'You' : user}
      </div>
    </div>
  );
};

export default UserBadge;
