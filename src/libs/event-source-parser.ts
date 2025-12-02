/**
 * EventSourceParserStream
 * A compact, single-file implementation of Server-Sent Events parsing.
 */

// --- Types & Interfaces ---

export interface EventSourceMessage {
  id?: string;
  event?: string;
  data: string;
}

export type EventSourceParser = {
  feed(chunk: string): void;
  reset(options?: { consume?: boolean }): void;
};

export interface ParserCallbacks {
  onEvent(event: EventSourceMessage): void;
  onRetry?(retry: number): void;
  onError?(error: ParseError): void;
  onComment?(comment: string): void;
}

export interface StreamOptions {
  onError?: 'terminate' | ((error: Error) => void);
  onRetry?: (retry: number) => void;
  onComment?: (comment: string) => void;
}

// --- Errors ---

export type ErrorType = 'invalid-retry' | 'unknown-field';

export class ParseError extends Error {
  public readonly type: ErrorType;
  public readonly field?: string;
  public readonly value?: string;
  public readonly line?: string;

  constructor(message: string, options: { type: ErrorType; field?: string; value?: string; line?: string }) {
    super(message);
    this.name = 'ParseError';
    this.type = options.type;
    this.field = options.field;
    this.value = options.value;
    this.line = options.line;
  }
}

// --- Core Logic ---

function noop() {}

function splitLines(chunk: string): [string[], string] {
  const lines: string[] = [];
  let incompleteLine = '';
  let searchIndex = 0;

  while (searchIndex < chunk.length) {
    const crIndex = chunk.indexOf('\r', searchIndex);
    const lfIndex = chunk.indexOf('\n', searchIndex);
    let lineEnd = -1;

    if (crIndex !== -1 && lfIndex !== -1) {
      lineEnd = Math.min(crIndex, lfIndex);
    } else if (crIndex !== -1) {
      // If CR is at the end, it might be part of CRLF in the next chunk
      if (crIndex === chunk.length - 1) {
        lineEnd = -1;
      } else {
        lineEnd = crIndex;
      }
    } else if (lfIndex !== -1) {
      lineEnd = lfIndex;
    }

    if (lineEnd === -1) {
      incompleteLine = chunk.slice(searchIndex);
      break;
    }

    const line = chunk.slice(searchIndex, lineEnd);
    lines.push(line);
    searchIndex = lineEnd + 1;
    if (chunk[searchIndex - 1] === '\r' && chunk[searchIndex] === '\n') {
      searchIndex++;
    }
  }
  return [lines, incompleteLine];
}

export function createParser(callbacks: ParserCallbacks): EventSourceParser {
  if (typeof callbacks === 'function') {
    throw new TypeError('`callbacks` must be an object.');
  }

  const { onEvent = noop, onError = noop, onRetry = noop, onComment } = callbacks;
  let incompleteLine = '';
  let isFirstChunk = true;
  let id: string | undefined;
  let data = '';
  let eventType = '';

  function feed(newChunk: string) {
    const chunk = isFirstChunk ? newChunk.replace(/^\xEF\xBB\xBF/, '') : newChunk;
    const [complete, incomplete] = splitLines(incompleteLine + chunk);

    for (const line of complete) {
      parseLine(line);
    }
    incompleteLine = incomplete;
    isFirstChunk = false;
  }

  function parseLine(line: string) {
    if (line === '') {
      dispatchEvent();
      return;
    }
    if (line.startsWith(':')) {
      onComment?.(line.slice(line.startsWith(': ') ? 2 : 1));
      return;
    }

    const fieldSeparatorIndex = line.indexOf(':');
    if (fieldSeparatorIndex !== -1) {
      const field = line.slice(0, fieldSeparatorIndex);
      const offset = line[fieldSeparatorIndex + 1] === ' ' ? 2 : 1;
      const value = line.slice(fieldSeparatorIndex + offset);
      processField(field, value, line);
    } else {
      processField(line, '', line);
    }
  }

  function processField(field: string, value: string, line: string) {
    switch (field) {
      case 'event':
        eventType = value;
        break;
      case 'data':
        data = `${data}${value}\n`;
        break;
      case 'id':
        id = value.includes('\0') ? undefined : value;
        break;
      case 'retry':
        if (/^\d+$/.test(value)) {
          onRetry(parseInt(value, 10));
        } else {
          onError(new ParseError(`Invalid \`retry\` value: "${value}"`, { type: 'invalid-retry', value, line }));
        }
        break;
      default:
        onError(new ParseError(`Unknown field "${field}"`, { type: 'unknown-field', field, value, line }));
        break;
    }
  }

  function dispatchEvent() {
    if (data.length > 0) {
      onEvent({
        id,
        event: eventType || undefined,
        data: data.endsWith('\n') ? data.slice(0, -1) : data,
      });
    }
    id = undefined;
    data = '';
    eventType = '';
  }

  return {
    feed,
    reset(options = {}) {
      if (incompleteLine && options.consume) parseLine(incompleteLine);
      isFirstChunk = true;
      id = undefined;
      data = '';
      eventType = '';
      incompleteLine = '';
    },
  };
}

// --- Stream Implementation ---

export class EventSourceParserStream extends TransformStream<string, EventSourceMessage> {
  constructor({ onError, onRetry, onComment }: StreamOptions = {}) {
    let parser: EventSourceParser;

    super({
      start(controller) {
        parser = createParser({
          onEvent: (event) => controller.enqueue(event),
          onError: (error) => {
            if (onError === 'terminate') {
              controller.error(error);
            } else if (typeof onError === 'function') {
              onError(error);
            }
          },
          onRetry,
          onComment,
        });
      },
      transform(chunk) {
        parser.feed(chunk);
      },
    });
  }
}