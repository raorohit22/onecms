import mongoose from 'mongoose';

export const healthService = {
  checkHealth: async () => { return { status: 'ok' }; },
  getReadiness: () => { 
    // mongoose.connection.readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const isReady = mongoose.connection.readyState === 1;
    return { isReady }; 
  }
};
