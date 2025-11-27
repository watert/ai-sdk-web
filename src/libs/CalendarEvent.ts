/**
 * 预设类型复用
 */
type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
type Frequency = "YEARLY" | "MONTHLY" | "WEEKLY" | "DAILY";
type EndType = "NEVER" | "COUNT" | "UNTIL_DATE";

interface RepeatEnd {
  type: EndType;
  value?: number | string;
}

// const randId = () => [Date.now().toString(16), Math.round(Math.random()*1e15).toString(16).slice(0, 12)].join('-');

export interface RepeatRule {
  frequency: Frequency;
  interval?: number; // default 1
  byWeekDays?: Weekday[];
  byMonthDays?: number[];
  byMonths?: number[];
  end?: Date | number | string | RepeatEnd;
}

export function parseRepeatEnd(end: Date | number | string | RepeatEnd | undefined): RepeatEnd | undefined {
  if (end instanceof Date) {
    return { type: "UNTIL_DATE", value: end.toISOString(), };
  }
  if (typeof end === "number") {
    return { type: "COUNT", value: end, };
  } 
  if (typeof end === "string") {
    return { type: "UNTIL_DATE", value: end, };
  }
  return end;
}

export interface EventDetails {
  id: string;
  title?: string;
  description?: string;
  startDateTime: string | Date; // 事件开始时间 (ISO 8601 字符串)
  endDateTime?: string | Date; // 事件结束时间 (ISO 8601 字符串). 结束时间之后不再触发, 如果不存在则不限制
  repeatRule?: RepeatRule | null;
  lastTriggeredTime?: string | Date | null;
}

// ==========================================================
// 文件级作用域的辅助方法 (Utils)
// ==========================================================

/**
 * 模拟间隔增加/减少
 */
function _addInterval(date: Date, interval: number, freq: Frequency): Date {
  const newDate = new Date(date);
  switch (freq) {
  case "YEARLY":
    newDate.setFullYear(newDate.getFullYear() + interval);
    break;
  case "MONTHLY": {
    // 确保不会因为月份溢出而跳过月份
    const newMonth = newDate.getMonth() + interval;
    newDate.setMonth(newMonth);
    // 修正：如果新的月份日期不存在，Date 会自动溢出到下一个月。
    // 实际 RRule 库有更复杂的处理，这里接受 JS Date 的默认行为。
    break;
  }
  case "WEEKLY":
    newDate.setDate(newDate.getDate() + interval * 7);
    break;
  case "DAILY":
    newDate.setDate(newDate.getDate() + interval);
    break;
  }
  return newDate;
}

/** * 模拟结束条件检查
 * ⚠️ 简单实现，COUNT 类型的准确性依赖于外部计数器。
 */
function _checkEndCondition(date: Date, end?: RepeatEnd | null): boolean {
  if (!end || end.type === "NEVER") {
    return true;
  }
  if (end.type === "UNTIL_DATE" && typeof end.value === "string") {
    // 确保比较的是日期，忽略时间部分可能产生的误差
    return date.getTime() <= new Date(end.value).getTime();
  }
  return true; // 对于 COUNT，我们依赖外部逻辑来中断循环
}

/**
 * 核心 RRule 计算器 (返回包含 start 和 end 的对象数组)
 */
function _calculateRecurrences(
  eventStart: Date,
  durationMs: number,
  rule: RepeatRule,
  start: Date,
  count: number
): { start: Date; end: Date }[] {
  // ⚠️ 此处实现沿用上次修正后的逻辑，但现在依赖外部的辅助函数
  const result: { start: Date; end: Date }[] = [];
  let current = new Date(eventStart);
  const isFuture = count > 0;
  const absCount = Math.abs(count);
  const interval = rule.interval || 1;

  if (isFuture) {
    // --- 计算未来事件 (N > 0) ---
    while (current.getTime() < start.getTime()) {
      current = _addInterval(current, interval, rule.frequency);
    }
    for (let i = 0; i < absCount; i++) {
      if (_checkEndCondition(current, parseRepeatEnd(rule.end))) {
        const newStart = new Date(current);
        const newEnd = new Date(newStart.getTime() + durationMs);
        result.push({ start: newStart, end: newEnd });
        current = _addInterval(current, interval, rule.frequency);
      } else {
        break;
      }
    }
  } else {
    // --- 计算过去事件 (N < 0) ---
    let latestPastEvent = new Date(eventStart);
    let nextEvent = new Date(eventStart);

    // 找到最后一个小于 start 的事件 (即最近的过去事件)
    while (nextEvent.getTime() < start.getTime()) {
      latestPastEvent = new Date(nextEvent);
      nextEvent = _addInterval(nextEvent, interval, rule.frequency);
      if (
        !_checkEndCondition(nextEvent, parseRepeatEnd(rule.end)) &&
        nextEvent.getTime() > eventStart.getTime()
      ) {
        break;
      }
    }

    current = latestPastEvent;
    for (let i = 0; i < absCount; i++) {
      if (current.getTime() >= eventStart.getTime()) {
        const newStart = new Date(current);
        const newEnd = new Date(newStart.getTime() + durationMs);
        result.push({ start: newStart, end: newEnd });
        current = _addInterval(current, -interval, rule.frequency); // 减去间隔
      } else {
        break;
      }
    }
    // 结果已经是按时间倒序排列的（最新的在前面）
  }

  return result;
}

// ==========================================================
// CalendarEvent Class
// ==========================================================

export class CalendarEvent {
  public data: EventDetails;
  public lastTriggered: Date | null = null;
  public durationMs: number;

  /**
   * @param eventData - 事件的基本信息和重复规则
   * @param options - 配置选项，包含 lastTriggeredTime
   */
  constructor(
    eventData: EventDetails
    // options: { lastTriggeredTime?: Date | string | null } = {}
  ) {
    this.data = eventData;

    const lastTriggeredTime = eventData?.lastTriggeredTime;
    if (lastTriggeredTime) {
      this.lastTriggered =
        lastTriggeredTime instanceof Date
          ? lastTriggeredTime
          : new Date(lastTriggeredTime);
    }

    const start = new Date(this.data.startDateTime).getTime();
    const end = !this.data.endDateTime ? null: new Date(this.data.endDateTime).getTime();
    this.durationMs = !end ? 0: end - start;
  }

  /** 核心属性的 Getter */
  public get id(): string {
    return this.data.id;
  }
  public get title(): string | undefined {
    return this.data.title;
  }
  public get startDateTime(): Date {
    return new Date(this.data.startDateTime);
  }
  public get endDateTime(): Date | null {
    if (!this.data.endDateTime) return null;
    return new Date(this.data.endDateTime);
  }
  public get repeatRule(): RepeatRule | undefined | null {
    return this.data.repeatRule;
  }

  // --- 附加功能 1: 获取下 N 次执行的事件或时间 ---

  public getNextOccurrences(n: number, fromDate: Date = new Date()): Date[] {
    if (!this.data.repeatRule) {
      // 单次事件处理：
      const eventTime = this.startDateTime;
      if (n === 1 && eventTime.getTime() >= fromDate.getTime()) {
        return [eventTime];
      }
      if (n === -1 && eventTime.getTime() < fromDate.getTime()) {
        return [eventTime];
      }
      return [];
    }

    const occurrences = _calculateRecurrences(
      this.startDateTime,
      this.durationMs,
      this.data.repeatRule,
      fromDate,
      n
    ).map((o) => o.start);

    return occurrences;
  }

  // --- 附加功能 2: 记录上一次事件的时间 ---

  public getLastTriggeredTime(): Date | null {
    return this.lastTriggered;
  }

  public trigger(time: string | Date = new Date()): this {
    if (typeof time === 'string') { time = new Date(time); }
    this.lastTriggered = time;
    // 实际应用中，这里需要调用持久化存储
    console.log(
      `CalendarEvent ${this.id} marked as triggered at ${time.toISOString()}`
    );
    return this;
  }

  // --- 附加功能 3: 根据上一次事件的时间，判定当前是否要触发 ---

  public shouldTrigger(
    now: Date = new Date(),
    lookbackDays = 1 // 默认超时 1 天以上的不会触发
  ): boolean {
    const lookbackStart = new Date(now.getTime() - lookbackDays * 24 * 3600e3);
    
    if (!this.data.repeatRule) {
      // 单次事件逻辑
      const eventStart = this.startDateTime;
      
      if (eventStart.getTime() < now.getTime() && eventStart.getTime() >= lookbackStart.getTime()) {
        // 事件已发生且在检查窗口内
        return this.lastTriggered === null || this.lastTriggered.getTime() < eventStart.getTime();
      }
      return false;
    }

    // 重复事件逻辑：找出最近的 5 个过去的事件
    const { startDateTime, durationMs, data: { repeatRule } } = this;
    const pastOccurrences = _calculateRecurrences(startDateTime, durationMs, repeatRule, now, -5);

    for (const occurrence of pastOccurrences) {
      const eventTime = occurrence.start.getTime();
      if (eventTime < now.getTime() && eventTime >= lookbackStart.getTime()) {
        // 事件已发生且在检查窗口内
        if (this.lastTriggered === null || this.lastTriggered.getTime() < eventTime) {
          return true;
        }
      }
    }

    return false;
  }
  public toJSON() {
    return {
      ...this.data,
      lastTriggered: this.lastTriggered?.toISOString() || null,
    };
  }

}
