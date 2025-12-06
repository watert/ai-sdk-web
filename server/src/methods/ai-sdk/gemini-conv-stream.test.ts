import { GeminiConvStream } from './gemini-conv-stream';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, UIMessage } from 'ai';
import { proxyFetch } from './ai-gen-text';
import _ from 'lodash';

// Mock external dependencies
// jest.mock('@ai-sdk/google');
// jest.mock('ai');

describe('GeminiConvStream', () => {
  let geminiConvStream: GeminiConvStream;
  const mockMessages: UIMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      parts: [{ type: 'text', text: 'Hello' }]
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance before each test
    geminiConvStream = new GeminiConvStream({
      apiKey: process.env.GPT_GEMINI,
      fetch: proxyFetch as any,
      messages: mockMessages,
      model: 'gemini-flash-latest'
    });
  });

  describe('constructor', () => {
    it('should initialize with default values when no arguments are provided', () => {
      const stream = new GeminiConvStream({ messages: [], model: '' });
      expect(stream['messages']).toEqual([]);
      expect(stream['model']).toBe('');
      expect(stream['emitter']).toBeDefined();
    });

    it('should initialize with provided messages and model', () => {
      expect(geminiConvStream['messages']).toEqual(mockMessages);
      expect(geminiConvStream['model']).toBe('gemini-flash-latest');
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const state = geminiConvStream.getState();
      
      expect(state).toEqual({
        messages: mockMessages,
        streaming: false,
        thinking: false
      });
    });
  });

  describe('setMessages', () => {
    it('should update messages correctly', () => {
      const newMessages: UIMessage[] = [
        {
          id: 'msg-2',
          role: 'user',
          parts: [{ type: 'text', text: 'New message' }]
        }
      ];
      
      geminiConvStream.setMessages(newMessages);
      
      expect(geminiConvStream['messages']).toEqual(newMessages);
    });
  });

  describe('subscribe', () => {
    it('should allow subscribing to state changes', () => {
      const mockSubscriber = jest.fn();
      
      // Subscribe to state changes
      const unsubscribe = geminiConvStream.subscribe(mockSubscriber);
      
      // Verify the subscriber was added
      // This is an indirect test since the emitter is private
      expect(typeof unsubscribe).toBe('function');
    });
  });
  describe('sendMessage', () => {
    it('should send a message and update state', async () => {
      const mockMessage: UIMessage = {
        id: 'msg-2', role: 'user',
        parts: [{ type: 'text', text: 'Test message' }]
      };
      geminiConvStream.setMessages([])
      geminiConvStream.subscribe((state) => {
        console.log('on state', state, 'lastmsg', _.last(state.messages));
      });
      await geminiConvStream.sendMessage({
        message: mockMessage,
        providerOptions: {
          google: { thinkingConfig: { thinkingBudget: -1, includeThoughts: true } }
        },
      });
      
      expect(geminiConvStream['messages']).toContainEqual(mockMessage);
    });
  });
});
