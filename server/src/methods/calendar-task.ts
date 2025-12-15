
/**

const calendar = new CalendarEvent({
  id: 'TEST_DAILY', title: 'TEST_DAILY', startDateTime: '2025-01-01T08:00Z',
  repeatRule: { frequency: 'DAILY', interval: 1 },
});
const task = async (info: { date: Date, id: string }) => { return new Date(); };
const model = new LocalMongoModel('test_calendar_task');

 */

import { CalendarEvent, RepeatRule } from "../libs/CalendarEvent";
import { getErrorInfo } from "../libs/getErrorInfo";
import { LocalMongoModel } from "../models/local-mongo-model";

export type calendarTaskResult<T = any> = {
  _id: any;
  calendarId: string;
  taskTime: Date,
  data: T,
  error?: any,
  rule?: Partial<RepeatRule>,
  updatedAt: Date,
  taskInfo?: { status: 'skip' | 'success' | 'error'; duration?: number; message?: string; }
};
// will skip if task is not triggerable
export async function handleCalendarTask<T=any>({ calendar, task, model, force }: {
  calendar: CalendarEvent,
  task: (info: { taskTime: Date, calendarId: string }) => Promise<any>,
  model: LocalMongoModel, // mongoose like model
  force?: boolean,
}): Promise<calendarTaskResult<T>> {
  const calendarId = calendar.id;
  console.log('handleCalendarTask', { calendarId });
  const lastDoc = await model.findOne({ calendarId }, undefined, { sort: { taskTime: -1 } }).lean();
  if (lastDoc?.taskTime) {
    calendar.trigger(lastDoc.taskTime);
  }
  if (!force && !calendar.shouldTrigger()) {
    console.log('should not trigger', calendarId);
    return { ...lastDoc, taskInfo: { status: 'skip', message: 'Task not triggered due to calendar rules' } };
  }
  const taskTime = calendar.getNextOccurrences(-1)?.[0];
  const info = { taskTime, calendarId };
  let body: any = { calendarId, taskTime }, error: any = null;
  const prevDocPromise = model.findOne({ calendarId, taskTime }).lean();
  
  // 记录任务开始时间
  const startTime = Date.now();
  let status: 'success' | 'error' = 'success';
  let taskMessage = '';
  
  let data = await task(info).catch(err => {
    error = getErrorInfo(err);
    status = 'error';
    taskMessage = error.message || 'Task execution failed';
    return {};
  });
  
  // 计算执行时长
  const duration = Date.now() - startTime;
  
  // console.log('assign?', await prevDocPromise || {}, data);
  Object.assign(data, await prevDocPromise || {}, data);
  const now = new Date();
  Object.assign(body, { data, rule: calendar.repeatRule, triggeredAt: now, updatedAt: now, error });
  
  // 执行状态信息
  const taskInfo = { status, duration, message: taskMessage };
  
  // 不将 taskInfo 写入 model，仅作为返回值
  console.log('calendar: try write db result');
  const result = await model.findOneAndUpdate({ calendarId, taskTime }, body, { upsert: true }).lean();
  console.log('result', result);
  return { ...result, taskInfo };
}