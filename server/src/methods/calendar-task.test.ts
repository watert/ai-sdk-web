import { CalendarEvent } from "../libs/CalendarEvent";
import { LocalMongoModel } from "../models/local-mongo-model";
import { handleCalendarTask } from "./calendar-task";


describe('calendar-task', () => {
  it('should handle calendar task', async () => {

    const calendar = new CalendarEvent({
      id: 'TEST_DAILY', title: 'TEST_DAILY', startDateTime: '2025-01-01T08:00+08:00',
      repeatRule: { frequency: 'DAILY', interval: 1 },
    });
    const task = async (_info: { taskTime: Date, calendarId: string }) => { return { msg: `Executed: ${(new Date()).toISOString()}` }; };
    const model = LocalMongoModel.fromCollection('calendar-task');
    const res = await handleCalendarTask({ calendar, task, model, force: true });
    console.log('res', res);
  });
})