import type { ExtendedUIMessage } from '../src/components/message-types';

const NOW = Date.now();

export const MOCK_MESSAGES: ExtendedUIMessage[] = [
  // 1. Simple System Intro (implied or first assistant message)
  {
    id: 'msg-001',
    role: 'assistant',
    content: 'Hello! I am Gemini. How can I help you today?',
    parts: [
        { type: 'text', text: 'Hello! I am Gemini. I can help you with analysis, coding, creative writing, and more. How can I help you today?' }
    ],
    metadata: {
      model: 'gemini-2.5-flash',
      createdAt: NOW - 100000,
      usage: { promptTokens: 0, completionTokens: 25, totalTokens: 25 }
    }
  },

  // 2. User uploading a file and asking a question
  {
    id: 'msg-002',
    role: 'user',
    content: 'Analyze this data file for me.',
    parts: [
      { 
        type: 'file', 
        uri: '#', 
        mimeType: 'text/csv', 
        name: 'quarterly_sales_2024.csv',
        size: '245 KB'
      },
      { type: 'text', text: 'Analyze this sales data file. What is the trend for Q3?' }
    ],
    metadata: { createdAt: NOW - 90000 }
  },

  // 3. Assistant using Reasoning and Tools
  {
    id: 'msg-003',
    role: 'assistant',
    content: 'Analyzing data...', // Fallback
    parts: [
      {
        type: 'reasoning',
        text: 'The user wants to analyze a CSV file named "quarterly_sales_2024.csv" specifically for Q3 trends. \n1. I need to read the file first.\n2. Then filter for Q3 months (July, August, September).\n3. Calculate the growth rate.',
      },
      {
        type: 'tool-call',
        toolCallId: 'call_abc123',
        toolName: 'read_csv',
        args: { filename: 'quarterly_sales_2024.csv', columns: ['date', 'revenue'] }
      },
      {
        type: 'tool-result',
        toolCallId: 'call_abc123',
        toolName: 'read_csv',
        result: { 
            status: 'success', 
            rows_preview: [
                { date: '2024-07-01', revenue: 12000 },
                { date: '2024-08-01', revenue: 15400 },
                { date: '2024-09-01', revenue: 18900 }
            ],
            total_rows: 90
        }
      },
      {
        type: 'text',
        text: 'I\'ve read the data. Based on the preliminary scan, revenue grew consistently from July to September.'
      }
    ],
    metadata: {
      model: 'gemini-2.5-flash-thinking',
      createdAt: NOW - 85000,
      usage: { promptTokens: 150, completionTokens: 120, totalTokens: 270 }
    }
  },

  // 4. User request for visual
  {
    id: 'msg-004',
    role: 'user',
    content: 'Great. Can you visualize that?',
    parts: [{ type: 'text', text: 'Great. Can you visualize that trend for me?' }],
    metadata: { createdAt: NOW - 60000 }
  },

  // 5. Assistant generating an image
  {
    id: 'msg-005',
    role: 'assistant',
    content: 'Generating chart...',
    parts: [
      {
        type: 'text',
        text: 'Here is the visualization of the Q3 sales trend:'
      },
      {
        type: 'image',
        uri: 'https://picsum.photos/seed/saleschart/600/400',
        alt: 'Bar chart showing Q3 revenue growth',
        mimeType: 'image/jpeg'
      },
      {
        type: 'text',
        text: 'As you can see, there is a strong upward trajectory peaking in September.'
      }
    ],
    metadata: {
      model: 'gemini-3-pro-image-preview',
      createdAt: NOW - 58000,
      usage: { promptTokens: 50, completionTokens: 500, totalTokens: 550 }
    }
  },

  // 6. Complex edge case: Large tool output and error handling
  {
    id: 'msg-006',
    role: 'user',
    content: 'Now check the stock price for "INVALID_TICKER" and AAPL.',
    parts: [{ type: 'text', text: 'Now check the stock price for "INVALID_TICKER" and AAPL.' }],
    metadata: { createdAt: NOW - 30000 }
  },

  {
    id: 'msg-007',
    role: 'assistant',
    content: 'Checking stocks...',
    parts: [
      {
        type: 'tool-call',
        toolCallId: 'call_xyz789',
        toolName: 'get_stock_price',
        args: { tickers: ['INVALID_TICKER', 'AAPL'] }
      },
      {
        type: 'tool-result',
        toolCallId: 'call_xyz789',
        toolName: 'get_stock_price',
        result: {
            errors: [{ ticker: 'INVALID_TICKER', code: 404, message: 'Ticker not found' }],
            success: [{ ticker: 'AAPL', price: 225.50, currency: 'USD', change_percent: +1.2 }]
        },
        isError: false // The tool call succeeded, but contained domain errors
      },
      {
         type: 'reasoning',
         text: 'The user requested a non-existent ticker. I should politely inform them about the error while providing the data for Apple.',
         state: 'streaming',
      },
      {
        type: 'text',
        text: 'I found the data for Apple (AAPL), which is trading at $225.50.\n\nHowever, I couldn\'t find any information for "INVALID_TICKER". Please check the symbol and try again.'
      }
    ],
    metadata: {
      model: 'gemini-2.5-flash',
      createdAt: NOW - 28000,
      usage: { promptTokens: 40, completionTokens: 80, totalTokens: 120 }
    }
  }
];