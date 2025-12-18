import { getMongoLock } from './MongoLock';
import asyncWait from '../libs/asyncWait';
import { JobCallback, scheduleJob } from 'node-schedule';

export async function runJobWithLock(lockKey: string, lockDurationMs: number, fn: () => any) {
  await getMongoLock(`CRON__${lockKey}`, lockDurationMs).then(async (lockDoc) => {
    // console.log('lockDoc', lockDoc);
    return await fn();
  }, err => {
    if (err.message.includes('LockObtainFail')) {
      console.log(`CronJobSkip:${lockKey} LockObtainFail`);
      return;
    }
    console.log('runJobWithLock run failed', err);
  });
}
export function createJobWithLock(lockKey: string, lockDurationMs: number, fn: JobCallback) {
  return (fireDate: Date) => runJobWithLock(lockKey, lockDurationMs, () => fn(fireDate));
}


export async function startScheduleJob({
  cron = '* 0 * * * *', // default every hour
  key,
  lockDurationMs = 600e3, // default 10 min
  execute,
}: {
  cron: string,
  key: string,
  lockDurationMs?: number,
  execute: JobCallback,
}) {
  scheduleJob(cron, createJobWithLock(key, lockDurationMs, execute));  
}

export async function startCronJobs() {
  await startScheduleJob({
    key: 'test_agenda', cron: '*/5 * * * * *', /* 5 seconds */ lockDurationMs: 30e3,
    execute: async (fireDate: Date) => {
      const datestr = (new Date).toISOString();
      console.log('test_agenda called', datestr, {fireDate});
      await asyncWait(5000);
      return datestr;
    },
  });
}