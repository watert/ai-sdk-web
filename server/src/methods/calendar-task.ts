
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

// will skip if task is not triggerable
export async function handleCalendarTask<T=any>({ calendar, task, model, force }: {
  calendar: CalendarEvent,
  task: (info: { taskTime: Date, calendarId: string }) => Promise<any>,
  model: LocalMongoModel, // mongoose like model
  // model: any, // mongoose like model
  force?: boolean,
}): Promise<{
  _id: any;
  calendarId: string;
  taskTime: Date,
  data: T,
  error?: any,
  rule?: Partial<RepeatRule>,
  updatedAt: Date,
}> {
  const calendarId = calendar.id;
  const lastDoc = await model.findOne({ calendarId }).sort({ taskTime: -1 }).lean();
  if (lastDoc?.taskTime) {
    calendar.trigger(lastDoc.taskTime);
  }
  if (!force && !calendar.shouldTrigger()) {
    console.log('should not trigger', calendarId);
    return lastDoc;
  }
  const taskTime = calendar.getNextOccurrences(-1)?.[0];
  const info = { taskTime, calendarId };
  let body: any = { calendarId, taskTime }, error: any = null;
  const prevDocPromise = model.findOne({ calendarId, taskTime }).lean();
  const data = await task(info).catch(err => {
    error = getErrorInfo(err);
    return {};
  });
  Object.assign(data, await prevDocPromise, data);
  Object.assign(body, { data, rule: calendar.data?.repeatRule, updatedAt: new Date(), error });
  return await model.findOneAndUpdate({ calendarId, taskTime }, body, { upsert: true }).lean();
}