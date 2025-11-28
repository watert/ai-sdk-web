import { CalendarEvent } from "./CalendarEvent";
import type { EventDetails, RepeatRule } from "./CalendarEvent";

// --- 模拟当前时间：2025年1月15日 12:00:00 JST ---
// ⚠️ 注意：为了确保测试环境统一，我们假设事件时间也使用 Z 时区
const MOCK_NOW = new Date("2025-01-15T12:00:00.000Z");
globalThis.Date = class MockDate extends Date {
  constructor(date?: string | number | Date) {
    if (date) {
      super(date);
    } else {
      super(MOCK_NOW);
    }
  }
  toString(): string {
    return this.toISOString();
  }
} as typeof Date;

// ---------------------------------------------------

describe("CalendarEvent Class with Adjusted Constructor", () => {
  const weeklyRule = {
    frequency: "WEEKLY",
    interval: 1,
    byDays: ["WE"],
  }; // 每周三

  const eventDetails = {
    id: "E001",
    title: "Weekly Meeting",
    startDateTime: "2025-01-01T10:00:00.000Z", // 星期三
    endDateTime: "2025-02-01T11:00:00.000Z",
  };

  const recurringEventDetails = { ...eventDetails, repeatRule: weeklyRule as RepeatRule };

  const pastSingleEventDetails = {
    id: "E004",
    title: "Past Event",
    startDateTime: "2025-01-05T09:00:00.000Z", // 过去事件
    endDateTime: "2025-01-05T10:00:00.000Z",
    repeatRule: null as any,
  };

  it("should initialize correctly with options object constructor", () => {
    const mockTriggerTime = "2025-01-02T10:00:00.000Z";
    const event = new CalendarEvent({ ...eventDetails, lastTriggeredTime: mockTriggerTime });

    expect(event.id).toBe("E001");
    expect(event.title).toBe("Weekly Meeting");
    expect(event.endDateTime?.toISOString()).toBe("2025-02-01T11:00:00.000Z");
    expect(event.getLastTriggeredTime()!.toISOString()).toBe(mockTriggerTime);
  });

  describe("daily rule", () => {
    const basicDailyEvent: EventDetails = {
      id: 'TEST_DAILY', title: 'TEST_DAILY', startDateTime: '2025-01-01T08:00Z',
      repeatRule: { frequency: 'DAILY', interval: 1 },
    }
    it("should able to do daily rule", () => {
      const event = new CalendarEvent({ ...basicDailyEvent });
      const MOCK_NOW = new Date("2025-01-15T12:00Z");
      const next = event.getNextOccurrences(1, MOCK_NOW)?.[0];
      expect(event.shouldTrigger()).toBeTruthy();
      expect(event.trigger().shouldTrigger()).toBeFalsy();
      expect(next).toMatchInlineSnapshot(`2025-01-16T08:00:00.000Z`)
    });
    it('should able to pass trigger time', () => {
      const triggeredEvent = new CalendarEvent({ ...basicDailyEvent, lastTriggeredTime: '2025-01-15T08:00:01Z'})
      expect(triggeredEvent.shouldTrigger()).toBeFalsy();
    })
  });
  describe("getNextOccurrences (RRule Calculation)", () => {
    it("should return the next N future occurrences (N>0)", () => {
      const event = new CalendarEvent(recurringEventDetails);
      // MOCK_NOW 是 1/15 (周三)。下两次是 1/22 和 1/29
      const nextDates = event.getNextOccurrences(2, MOCK_NOW);
      expect(nextDates.length).toBe(2);
      expect(nextDates[0].toISOString()).toContain("2025-01-22T");
    });
    it("should return the next N future occurrences (N>0)", () => {
    
      const event = new CalendarEvent({ ...recurringEventDetails, repeatRule: {
        ...recurringEventDetails.repeatRule, end: '2025-01-25T10:00:00.000Z'
      } });
      // MOCK_NOW 是 1/15 (周三)。下两次是 1/22 和 1/29, 但 1/29 已经超过了 endDateTime
      const nextDates = event.getNextOccurrences(2, MOCK_NOW);
      expect(nextDates.length).toBe(1);
      expect(nextDates[0].toISOString()).toContain("2025-01-22T");
    });
    
    describe("byWeekDays support", () => {
      it("should return occurrences only on specified weekdays (single day)", () => {
        const weeklyEventWithByDays: EventDetails = {
          id: 'TEST_WEEKLY_BYDAY',
          title: 'TEST_WEEKLY_BYDAY',
          startDateTime: '2025-01-01T08:00Z', // 周三
          repeatRule: { 
            frequency: 'WEEKLY', 
            interval: 1, 
            byWeekDays: ['FR'] // 仅周五
          },
        };
        const event = new CalendarEvent(weeklyEventWithByDays);
        const nextDates = event.getNextOccurrences(3, MOCK_NOW);
        expect(nextDates.length).toBe(3);
        // 验证所有日期都是周五
        nextDates.forEach(date => {
          expect(date.getDay()).toBe(5); // 周五是 5
        });
        // 验证日期顺序正确
        expect(nextDates[0].toISOString()).toContain("2025-01-17T"); // 下一个周五
        expect(nextDates[1].toISOString()).toContain("2025-01-24T");
        expect(nextDates[2].toISOString()).toContain("2025-01-31T");
      });
      
      it("should return occurrences only on specified weekdays (multiple days)", () => {
        const weeklyEventWithMultiByDays: EventDetails = {
          id: 'TEST_WEEKLY_MULTI_BYDAY',
          title: 'TEST_WEEKLY_MULTI_BYDAY',
          startDateTime: '2025-01-01T08:00Z', // 周三
          repeatRule: { 
            frequency: 'WEEKLY', 
            interval: 1, 
            byWeekDays: ['MO', 'WE', 'FR'] // 周一、周三、周五
          },
        };
        const event = new CalendarEvent(weeklyEventWithMultiByDays);
        const nextDates = event.getNextOccurrences(6, MOCK_NOW);
        expect(nextDates.length).toBe(6);
        
        // 验证日期顺序和星期几正确
        // MOCK_NOW 是 1/15 (周三)，所以下一个事件是 1/15 (周三)、1/17 (周五)、1/20 (周一) 等
        const expectedDays = [3, 5, 1, 3, 5, 1]; // 周三、周五、周一、周三、周五、周一
        nextDates.forEach((date, index) => {
          expect(date.getDay()).toBe(expectedDays[index]);
        });
      });
      
      it("should handle different intervals with byWeekDays", () => {
        const weeklyEventWithInterval: EventDetails = {
          id: 'TEST_WEEKLY_INTERVAL',
          title: 'TEST_WEEKLY_INTERVAL',
          startDateTime: '2025-01-01T08:00Z', // 周三
          repeatRule: { 
            frequency: 'WEEKLY', 
            interval: 2, // 每两周
            byWeekDays: ['TU', 'TH'] // 周二、周四
          },
        };
        const event = new CalendarEvent(weeklyEventWithInterval);
        const nextDates = event.getNextOccurrences(4, MOCK_NOW);
        expect(nextDates.length).toBe(4);
        
        // 验证日期间隔正确
        for (let i = 1; i < nextDates.length; i++) {
          const diffDays = (nextDates[i].getTime() - nextDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThanOrEqual(2); // 至少间隔 2 天
        }
      });
      
      it("should throw error if no matching weekdays", () => {
        const weeklyEventWithNoMatch: EventDetails = {
          id: 'TEST_WEEKLY_NO_MATCH',
          title: 'TEST_WEEKLY_NO_MATCH',
          startDateTime: '2025-01-01T08:00Z', // 周三
          repeatRule: {
            frequency: 'WEEKLY',
            interval: 1,
            byWeekDays: [] // 空数组，无匹配
          },
        };
        const event = new CalendarEvent(weeklyEventWithNoMatch);
        expect(() => event.getNextOccurrences(3, MOCK_NOW)).toThrow("byWeekDays array cannot be empty");
      });
    });

    describe("byMonthDays support", () => {
      it("should return occurrences only on specified month days (single day)", () => {
        const monthlyEventWithSingleByDay: EventDetails = {
          id: 'TEST_MONTHLY_SINGLE_BYDAY',
          title: 'TEST_MONTHLY_SINGLE_BYDAY',
          startDateTime: '2025-01-01T08:00Z', // 1月1日
          repeatRule: {
            frequency: 'MONTHLY',
            interval: 1,
            byMonthDays: [1] // 每月1日
          },
        };
        const event = new CalendarEvent(monthlyEventWithSingleByDay);
        const nextDates = event.getNextOccurrences(3, MOCK_NOW);
        expect(nextDates.length).toBe(3);
        
        // 验证日期都是每月1日
        nextDates.forEach(date => {
          expect(date.getDate()).toBe(1);
        });
      });
      
      it("should return occurrences only on specified month days (multiple days)", () => {
        const monthlyEventWithMultiByDays: EventDetails = {
          id: 'TEST_MONTHLY_MULTI_BYDAY',
          title: 'TEST_MONTHLY_MULTI_BYDAY',
          startDateTime: '2025-01-01T08:00Z', // 1月1日
          repeatRule: {
            frequency: 'MONTHLY',
            interval: 1,
            byMonthDays: [1, 15] // 每月1日和15日
          },
        };
        const event = new CalendarEvent(monthlyEventWithMultiByDays);
        const nextDates = event.getNextOccurrences(6, MOCK_NOW);
        expect(nextDates.length).toBe(6);
        
        // 验证日期顺序和月份天数正确
        const expectedDays = [1, 15, 1, 15, 1, 15]; // 1日、15日交替
        nextDates.forEach((date, index) => {
          expect(date.getDate()).toBe(expectedDays[index]);
        });
      });
      
      it("should handle different intervals with byMonthDays", () => {
        const monthlyEventWithInterval: EventDetails = {
          id: 'TEST_MONTHLY_INTERVAL',
          title: 'TEST_MONTHLY_INTERVAL',
          startDateTime: '2025-01-01T08:00Z', // 1月1日
          repeatRule: {
            frequency: 'MONTHLY',
            interval: 2, // 每两个月
            byMonthDays: [5, 20] // 每月5日和20日
          },
        };
        const event = new CalendarEvent(monthlyEventWithInterval);
        const nextDates = event.getNextOccurrences(4, MOCK_NOW);
        expect(nextDates.length).toBe(4);
        
        // 验证日期间隔正确
        for (let i = 2; i < nextDates.length; i++) {
          const diffDays = (nextDates[i].getTime() - nextDates[i-2].getTime()) / (1000 * 60 * 60 * 24);
          expect(diffDays).toBeGreaterThanOrEqual(50); // 至少间隔约两个月
        }
      });
      
      it("should throw error if byMonthDays is empty array", () => {
        const monthlyEventWithNoMatch: EventDetails = {
          id: 'TEST_MONTHLY_NO_MATCH',
          title: 'TEST_MONTHLY_NO_MATCH',
          startDateTime: '2025-01-01T08:00Z', // 1月1日
          repeatRule: {
            frequency: 'MONTHLY',
            interval: 1,
            byMonthDays: [] // 空数组，无匹配
          },
        };
        const event = new CalendarEvent(monthlyEventWithNoMatch);
        expect(() => event.getNextOccurrences(3, MOCK_NOW)).toThrow("byMonthDays array cannot be empty");
      });
    });

    it("should return the last N past occurrences (N<0)", () => {
      const event = new CalendarEvent(recurringEventDetails);
      // MOCK_NOW 是 1/15 12:00Z。前两次是 1/15 10:00Z 和 1/8 10:00Z
      const pastDates = event.getNextOccurrences(-2, MOCK_NOW);
      expect(pastDates.length).toBe(2);
      expect(pastDates[0].toISOString()).toContain("2025-01-15T10:00:00.000Z");
      expect(pastDates[1].toISOString()).toContain("2025-01-08T10:00:00.000Z");
    });

    it("should correctly handle future single events", () => {
      const futureSingleEvent = {
        ...eventDetails,
        repeatRule: null as any,
        startDateTime: "2025-01-20T10:00:00.000Z",
      };
      const event = new CalendarEvent(futureSingleEvent);
      expect(event.getNextOccurrences(1, MOCK_NOW).length).toBe(1);
      expect(event.getNextOccurrences(2, MOCK_NOW).length).toBe(0);
    });

    it("should correctly handle past single events", () => {
      const event = new CalendarEvent(pastSingleEventDetails);
      expect(event.getNextOccurrences(-1, MOCK_NOW).length).toBe(1);
      expect(event.getNextOccurrences(-2, MOCK_NOW).length).toBe(0);
    });
  });

  describe("Trigger Status and Management", () => {

    it("shouldTrigger should be TRUE for a recently missed recurring event", () => {
      // 最近一次事件是 1/15 10:00。 lastTriggered 为 null。
      const event = new CalendarEvent(recurringEventDetails);
      expect(event.shouldTrigger()).toBe(true);
    });

    it("shouldTrigger should be FALSE if the recent recurring event was triggered", () => {
      // 上次触发时间标记在 1/15 11:00 (晚于事件发生时间)。
      const lastTriggeredTime = new Date("2025-01-15T11:00:00.000Z");
      const event = new CalendarEvent({ ...recurringEventDetails, lastTriggeredTime });
      expect(event.shouldTrigger()).toBe(false);
    });

    it("shouldTrigger should be TRUE for a past single event that was NOT triggered", () => {
      // Event: 1/5 09:00, LastTriggered: null, MOCK_NOW: 1/15
      const event = new CalendarEvent(pastSingleEventDetails);
      
      const time = new Date(event.startDateTime.getTime() + 0.5 * 3600e3);
      expect(event.shouldTrigger(time)).toBe(true);
    });

    it("shouldTrigger should be FALSE for a single event that WAS triggered", () => {
      // Event: 1/5 09:00, LastTriggered: 1/5 10:00
      const triggeredTime = new Date("2025-01-05T10:00:00.000Z");
      const event = new CalendarEvent({ ...pastSingleEventDetails, lastTriggeredTime: triggeredTime });
      expect(event.shouldTrigger()).toBe(false);
    });

    it("shouldTrigger should be FALSE for a single event outside the lookback window", () => {
      // Event: 1/5 09:00, MOCK_NOW: 1/15. lookbackDays: 7 (即从 1/8 开始检查)
      // 事件 1/5 在检查窗口之外。
      const event = new CalendarEvent(pastSingleEventDetails);
      // 将 lookbackDays 设置为 5，确保 1/5 在窗口之外 (1/15 - 5天 = 1/10)
      expect(event.shouldTrigger(MOCK_NOW, 5)).toBe(false);
    });
  });

  describe("triggeredCount and COUNT end type", () => {
    it("should initialize triggeredCount to 0 when not provided", () => {
      const event = new CalendarEvent(recurringEventDetails);
      expect(event.triggeredCount).toBe(0);
    });

    it("should initialize triggeredCount to provided value", () => {
      const event = new CalendarEvent({ ...recurringEventDetails, triggeredCount: 5 });
      expect(event.triggeredCount).toBe(5);
    });

    it("should increment triggeredCount when trigger() is called", () => {
      const event = new CalendarEvent(recurringEventDetails);
      expect(event.triggeredCount).toBe(0);
      event.trigger();
      expect(event.triggeredCount).toBe(1);
      event.trigger();
      expect(event.triggeredCount).toBe(2);
    });

    it("should return true for shouldTrigger when triggeredCount < COUNT end value", () => {
      const eventDetailsWithCountEnd: EventDetails = {
        id: "E002",
        title: "Limited Event",
        startDateTime: "2025-01-01T10:00:00.000Z",
        repeatRule: {
          frequency: "WEEKLY" as const,
          interval: 1,
          byWeekDays: ["WE" as const],
          end: { type: "COUNT" as const, value: 3 }
        },
        triggeredCount: 1
      };
      const event = new CalendarEvent(eventDetailsWithCountEnd);
      expect(event.shouldTrigger()).toBe(true);
    });

    it("should return false for shouldTrigger when triggeredCount >= COUNT end value", () => {
      const eventDetailsWithCountEnd: EventDetails = {
        id: "E002",
        title: "Limited Event",
        startDateTime: "2025-01-01T10:00:00.000Z",
        repeatRule: {
          frequency: "WEEKLY" as const,
          interval: 1,
          byWeekDays: ["WE" as const],
          end: { type: "COUNT" as const, value: 3 }
        },
        triggeredCount: 3
      };
      const event = new CalendarEvent(eventDetailsWithCountEnd);
      expect(event.shouldTrigger()).toBe(false);
    });

    it("should return empty array for getNextOccurrences when triggeredCount >= COUNT end value", () => {
      const eventDetailsWithCountEnd: EventDetails = {
        id: "E002",
        title: "Limited Event",
        startDateTime: "2025-01-01T10:00:00.000Z",
        repeatRule: {
          frequency: "WEEKLY" as const,
          interval: 1,
          byWeekDays: ["WE" as const],
          end: { type: "COUNT" as const, value: 3 }
        },
        triggeredCount: 3
      };
      const event = new CalendarEvent(eventDetailsWithCountEnd);
      const nextOccurrences = event.getNextOccurrences(2, MOCK_NOW);
      expect(nextOccurrences.length).toBe(0);
    });

    it("should return next occurrences when triggeredCount < COUNT end value", () => {
      const eventDetailsWithCountEnd: EventDetails = {
        id: "E002",
        title: "Limited Event",
        startDateTime: "2025-01-01T10:00:00.000Z",
        repeatRule: {
          frequency: "WEEKLY" as const,
          interval: 1,
          byWeekDays: ["WE" as const],
          end: { type: "COUNT" as const, value: 3 }
        },
        triggeredCount: 1
      };
      const event = new CalendarEvent(eventDetailsWithCountEnd);
      const nextOccurrences = event.getNextOccurrences(2, MOCK_NOW);
      expect(nextOccurrences.length).toBe(2);
    });

    it("should include triggeredCount in toJSON result", () => {
      const eventDetailsWithCountEnd: EventDetails = {
        id: "E002",
        title: "Limited Event",
        startDateTime: "2025-01-01T10:00:00.000Z",
        repeatRule: {
          frequency: "WEEKLY" as const,
          interval: 1,
          byWeekDays: ["WE" as const],
          end: { type: "COUNT" as const, value: 3 }
        },
        triggeredCount: 2
      };
      const event = new CalendarEvent(eventDetailsWithCountEnd);
      const jsonResult = event.toJSON();
      expect(jsonResult.triggeredCount).toBe(2);
    });
  });
});

// --- 清理模拟时间 ---
afterAll(() => {
  globalThis.Date = Date;
});
