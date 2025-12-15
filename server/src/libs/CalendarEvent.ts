
/**
 * 预设类型复用
 */
export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
export type Frequency = "MONTHLY" | "WEEKLY" | "DAILY"; // YEARLY 好像不需要
export type EndType = "NEVER" | "COUNT" | "UNTIL_DATE";

export interface RepeatEnd {
  type: EndType;
  value?: number | string;
}

// const randId = () => [Date.now().toString(16), Math.round(Math.random()*1e15).toString(16).slice(0, 12)].join('-');


export interface RepeatRule {
  frequency: Frequency;
  interval?: number; // default 1
  byWeekDays?: Weekday[]; // 每周的哪些天重复, 例如 ["MO", "WE", "FR"] 表示周一、周三、周五重复。在 type WEEKLY 时生效。
  byMonthDays?: number[]; // 每月的哪些天重复, 例如 [1, 15] 表示每月 1 号和 15 号重复。在 type MONTHLY 时生效。
  end?: Date | number | string | RepeatEnd;
}

export interface EventDetails {
  id: string;
  title?: string;
  description?: string;
  startDateTime: string | Date; // 事件开始时间 (ISO 8601 字符串)
  endDateTime?: string | Date; // 事件结束时间 (ISO 8601 字符串). 结束时间之后不再触发, 如果不存在则不限制
  hasEndTime?: boolean; // 是否有结束时间
  repeatRule?: RepeatRule | null;
  lastTriggeredTime?: string | Date | null;
  triggeredCount?: number; // 已触发次数
}
/**
 * 根据前面的 EventDetails 类型，设计一个表单界面，引入 react-hook-form 库。
 * 其中，
 */

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

// ==========================================================
// 文件级作用域的辅助方法 (Utils)
// ==========================================================

/**
 * 将星期几字符串转换为 Date 对象的 getDay() 返回值
 */
function _weekdayToNum(weekday: Weekday): number {
  const map: Record<Weekday, number> = {
    SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6
  };
  return map[weekday];
}

/**
 * 计算两个星期几之间的天数差
 */
function _getDaysDiff(currentDay: number, targetDay: number): number {
  const diff = targetDay - currentDay;
  return diff >= 0 ? diff : diff + 7;
}

/**
 * 模拟间隔增加/减少
 */
function _addInterval(date: Date, interval: number, freq: Frequency): Date {
  const newDate = new Date(date);
  switch (freq) {
  // case "YEARLY":
  //   newDate.setFullYear(newDate.getFullYear() + interval);
  //   break;
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

/**
 * 调整日期到指定的星期几
 */
function _adjustToWeekday(date: Date, weekday: Weekday): Date {
  const newDate = new Date(date);
  const currentDay = newDate.getDay();
  const targetDay = _weekdayToNum(weekday);
  const daysDiff = _getDaysDiff(currentDay, targetDay);
  newDate.setDate(newDate.getDate() + daysDiff);
  return newDate;
}

/** * 模拟结束条件检查
 * ⚠️ 简单实现，COUNT 类型的准确性依赖于外部计数器。
 */
function _checkEndCondition(date: Date, end?: RepeatEnd | null, triggeredCount = 0): boolean {
  if (!end || end.type === "NEVER") {
    return true;
  }
  if (end.type === "UNTIL_DATE" && typeof end.value === "string") {
    // 确保比较的是日期，忽略时间部分可能产生的误差
    return date.getTime() <= new Date(end.value).getTime();
  }
  if (end.type === "COUNT" && typeof end.value === "number") {
    // 检查已触发次数是否小于指定次数
    return triggeredCount < end.value;
  }
  return true;
}

/**
 * 检查日期是否符合 byWeekDays 规则
 */
function _isMatchingWeekdays(date: Date, byWeekDays?: Weekday[]): boolean {
  if (!byWeekDays || byWeekDays.length === 0) {
    return true; // 没有指定 byWeekDays，匹配所有日期
  }
  const dayNum = date.getDay();
  // 将 byWeekDays 转换为数字数组，然后检查日期的 dayNum 是否在其中
  const targetDays = byWeekDays.map(weekday => _weekdayToNum(weekday));
  return targetDays.includes(dayNum);
}

/**
 * 检查日期是否符合 byMonthDays 规则
 */
function _isMatchingMonthDays(date: Date, byMonthDays?: number[]): boolean {
  if (!byMonthDays || byMonthDays.length === 0) {
    return true; // 没有指定 byMonthDays，匹配所有日期
  }
  const dayOfMonth = date.getDate();
  return byMonthDays.includes(dayOfMonth);
}



/**
 * 核心 RRule 计算器 (返回包含 start 和 end 的对象数组)
 */
function _calculateRecurrences(
  eventStart: Date,
  durationMs: number,
  rule: RepeatRule,
  start: Date,
  count: number,
  triggeredCount = 0
): { start: Date; end: Date }[] {
  // ⚠️ 此处实现沿用上次修正后的逻辑，但现在依赖外部的辅助函数
  const result: { start: Date; end: Date }[] = [];
  let current = new Date(eventStart);
  const isFuture = count > 0;
  const absCount = Math.abs(count);
  const interval = rule.interval || 1;

  // 检查 byWeekDays 是否为空数组，为空则抛出异常
  if (rule.byWeekDays && rule.byWeekDays.length === 0) {
    throw new Error("byWeekDays array cannot be empty");
  }

  // 检查 byMonthDays 是否为空数组，为空则抛出异常
  if (rule.byMonthDays && rule.byMonthDays.length === 0) {
    throw new Error("byMonthDays array cannot be empty");
  }

  // 检查是否有匹配的星期几（用于优化）
  const hasValidByWeekDays = !rule.byWeekDays || 
    rule.byWeekDays.some(weekday => {
      const testDate = _adjustToWeekday(current, weekday);
      return _isMatchingWeekdays(testDate, rule.byWeekDays);
    });

  if (rule.frequency === "WEEKLY" && rule.byWeekDays && !hasValidByWeekDays) {
    throw new Error("No matching weekdays found");
  }

  // 对于 WEEKLY 频率且指定了 byWeekDays，先调整起始日期到第一个匹配的星期几
  if (rule.frequency === "WEEKLY" && rule.byWeekDays) {
    let adjusted = false;
    for (let i = 0; i < 7; i++) {
      if (_isMatchingWeekdays(current, rule.byWeekDays)) {
        adjusted = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }
    if (!adjusted) {
      throw new Error("No matching weekdays found");
    }
  }

  if (isFuture) {
    // --- 计算未来事件 (N > 0) ---
    // 先调整到开始日期之后
    while (current.getTime() < start.getTime()) {
      current = _addInterval(current, interval, rule.frequency);
    }
    
    let addedCount = 0;
    // 保存当前日期用于循环
    let baseDate = new Date(current);
    
    // 防止无限循环，设置最大迭代次数
    const maxIterations = absCount * 100;
    let iterations = 0;
    
    while (addedCount < absCount && iterations < maxIterations) {
      iterations++;
      
      // 检查是否超过结束条件
      if (!_checkEndCondition(baseDate, parseRepeatEnd(rule.end), triggeredCount + addedCount)) {
        break;
      }
      
      // 对于 WEEKLY 频率且指定了 byWeekDays，需要检查一周内的所有可能日期
      if (rule.frequency === "WEEKLY" && rule.byWeekDays && rule.byWeekDays.length > 0) {
        // 遍历一周内的所有日期，检查哪些匹配 byWeekDays
        const weekMatches: Date[] = [];
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(baseDate);
          checkDate.setDate(checkDate.getDate() + i);
          if (checkDate.getTime() < start.getTime()) {
            continue; // 跳过开始日期之前的匹配
          }
          if (_isMatchingWeekdays(checkDate, rule.byWeekDays)) {
            weekMatches.push(checkDate);
          }
        }
        
        // 如果没有匹配的日期，跳过这一周
        if (weekMatches.length > 0) {
          // 对于每个匹配的日期，添加到结果中
          for (const matchDate of weekMatches) {
            if (_checkEndCondition(matchDate, parseRepeatEnd(rule.end), triggeredCount + addedCount)) {
              const newStart = new Date(matchDate);
              const newEnd = new Date(newStart.getTime() + durationMs);
              result.push({ start: newStart, end: newEnd });
              addedCount++;
              
              // 如果已经达到指定数量，退出循环
              if (addedCount >= absCount) {
                break;
              }
            }
          }
        }
        
        // 增加一周的间隔
        baseDate.setDate(baseDate.getDate() + interval * 7);
      } else if (rule.frequency === "MONTHLY" && rule.byMonthDays && rule.byMonthDays.length > 0) {
        // 对于 MONTHLY 频率且指定了 byMonthDays，需要检查一个月内的所有指定日期
        const monthMatches: Date[] = [];
        const currentMonth = baseDate.getMonth();
        
        // 遍历所有指定的月份天数
        for (const day of rule.byMonthDays) {
          const checkDate = new Date(baseDate);
          checkDate.setDate(day);
          
          // 如果设置的日期超出了当月的天数，会自动调整到下个月，所以需要检查月份是否变化
          if (checkDate.getMonth() === currentMonth && checkDate.getTime() >= start.getTime()) {
            monthMatches.push(checkDate);
          }
        }
        
        // 如果没有匹配的日期，跳过这个月
        if (monthMatches.length > 0) {
          // 对匹配的日期进行排序
          monthMatches.sort((a, b) => a.getTime() - b.getTime());
          
          // 对于每个匹配的日期，添加到结果中
          for (const matchDate of monthMatches) {
            if (_checkEndCondition(matchDate, parseRepeatEnd(rule.end), triggeredCount + addedCount)) {
              const newStart = new Date(matchDate);
              const newEnd = new Date(newStart.getTime() + durationMs);
              result.push({ start: newStart, end: newEnd });
              addedCount++;
              
              // 如果已经达到指定数量，退出循环
              if (addedCount >= absCount) {
                break;
              }
            }
          }
        }
        
        // 增加一个月的间隔
        baseDate = _addInterval(baseDate, interval, rule.frequency);
      } else {
        // 其他频率或没有指定 byWeekDays/byMonthDays，直接添加日期
        if (_isMatchingWeekdays(baseDate, rule.byWeekDays) && _isMatchingMonthDays(baseDate, rule.byMonthDays)) {
          if (_checkEndCondition(baseDate, parseRepeatEnd(rule.end), triggeredCount + addedCount)) {
            const newStart = new Date(baseDate);
            const newEnd = new Date(newStart.getTime() + durationMs);
            result.push({ start: newStart, end: newEnd });
            addedCount++;
          }
        }
        
        // 增加间隔，使用 _addInterval 函数来处理不同频率
        baseDate = _addInterval(baseDate, interval, rule.frequency);
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
        !_checkEndCondition(nextEvent, parseRepeatEnd(rule.end), triggeredCount) &&
        nextEvent.getTime() > eventStart.getTime()
      ) {
        break;
      }
    }

    current = latestPastEvent;
    let addedCount = 0;
    while (addedCount < absCount) {
      if (current.getTime() >= eventStart.getTime()) {
        if (_isMatchingWeekdays(current, rule.byWeekDays) && _checkEndCondition(current, parseRepeatEnd(rule.end), triggeredCount)) {
          const newStart = new Date(current);
          const newEnd = new Date(newStart.getTime() + durationMs);
          result.push({ start: newStart, end: newEnd });
          addedCount++;
        }
        current = _addInterval(current, -interval, rule.frequency); // 减去间隔
        // 如果是 WEEKLY 频率，需要检查是否匹配 byWeekDays
        if (rule.frequency === "WEEKLY" && !_isMatchingWeekdays(current, rule.byWeekDays)) {
          // 每周调整一次，直到找到匹配的日期
          for (let i = 0; i < 6; i++) {
            current.setDate(current.getDate() - 1);
            if (_isMatchingWeekdays(current, rule.byWeekDays)) {
              break;
            }
          }
        }
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
    
    // 逻辑：如果 explicitly 设置了 hasEndTime 为 false，则忽略 endDateTime
    // 如果 hasEndTime 未定义，则回退到检查 endDateTime 是否存在
    const hasEnd = typeof this.data.hasEndTime === 'boolean' 
      ? this.data.hasEndTime 
      : !!this.data.endDateTime;

    const end = (hasEnd && this.data.endDateTime) ? new Date(this.data.endDateTime).getTime() : null;
    this.durationMs = !end ? 0: end - start;
  }

  /** 获取已触发次数 */
  public get triggeredCount(): number {
    return this.data.triggeredCount || 0;
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
  
  public get hasEndTime(): boolean {
    if (typeof this.data.hasEndTime === 'boolean') {
      return this.data.hasEndTime;
    }
    return !!this.data.endDateTime;
  }

  public get endDateTime(): Date | null {
    if (!this.hasEndTime) return null;
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
      n,
      this.triggeredCount
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
    // 增加触发次数
    this.data.triggeredCount = (this.data.triggeredCount || 0) + 1;
    // 实际应用中，这里需要调用持久化存储
    // console.log(
    //   `CalendarEvent ${this.id} marked as triggered at ${time.toISOString()}, triggeredCount: ${this.data.triggeredCount}`
    // );
    return this;
  }

  // --- 附加功能 3: 根据上一次事件的时间，判定当前是否要触发 ---

  public shouldTrigger(
    now: Date = new Date(),
    lookbackDays = 1 // 默认超时 1 天以上且非重复的不会触发
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

    // 检查是否已经达到最大触发次数
    const repeatEnd = parseRepeatEnd(this.data.repeatRule.end);
    if (repeatEnd?.type === "COUNT" && typeof repeatEnd.value === "number") {
      if (this.triggeredCount >= repeatEnd.value) {
        return false;
      }
    }

    // 重复事件逻辑：找出最近的 5 个过去的事件
    const { startDateTime, durationMs, data: { repeatRule } } = this;
    const pastOccurrences = _calculateRecurrences(startDateTime, durationMs, repeatRule, now, -5, this.triggeredCount);

    for (const occurrence of pastOccurrences) {
      const eventTime = occurrence.start.getTime();
      if (eventTime < now.getTime()) {
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
      hasEndTime: this.hasEndTime, // Explicitly include the logic flag
      triggeredCount: this.triggeredCount, // Explicitly include the triggered count
      lastTriggered: this.lastTriggered?.toISOString() || null,
    };
  }

}
