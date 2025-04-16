export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
};

export const QUEUE_NAMES = {
  EXP_PROCESSING: 'exp-processing',
};

export const JOB_NAMES = {
  PROCESS_EXP: 'process-exp',
};
