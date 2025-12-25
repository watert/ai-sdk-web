import path from "path";
import { LocalMongoModel } from "../models/local-mongo-model";
import { aiGenTextStream } from "../methods/ai-sdk/ai-gen-text";
import { exportStream, recoverExportedStream } from "./stream-helper";

const Model = new LocalMongoModel('stream_exports');
describe('stream-helper', () => {
  beforeAll(async () => {
    const testDoc = await Model.findOne({ id: 'ollama-hello' }).lean();
    if (!testDoc) {
      const result = await aiGenTextStream({ platform: 'OLLAMA', prompt: 'hello' });
      const stream = result.toUIMessageStream();
      const doc = {
        id: 'ollama-hello',
        ...await exportStream(stream, { onChunk: (chunk) => console.log('beforeAll ollama chunk', chunk) }),
      };
      console.log('doc', doc);
      await Model.create(doc);
    } else {
      console.log('skipped ollama-hello for exists');
    }
    // const result = await

  });
  it('recoverStream', async () => {
    const testDoc = await Model.findOne({ id: 'ollama-hello' }).lean();
    const stream = recoverExportedStream(testDoc);
    for await (const chunk of stream) {
      console.log('chunk', chunk);
    }
  });
});