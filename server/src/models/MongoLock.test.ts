import { getMongoLock, withMongoLock, LockModel, releaseMongoLock } from './MongoLock';

describe('MongoLock', () => {
  // beforeEach(async () => {
  //   await LockModel.deleteMany({});
  // });

  describe('getMongoLock', () => {
    it('should acquire a new lock', async () => {
      const key = 'test-key';
      const timeoutMs = 1000;
      const lock = await getMongoLock(key, timeoutMs);

      expect(lock).toBeDefined();
      expect(lock.key).toBe(key);
      expect(lock.clientId).toBeDefined();
      expect(lock.expireAt).toBeInstanceOf(Date);
      await releaseMongoLock(key);
    });

    it('should throw an error if the lock is already held', async () => {
      const key = 'test-key';
      const timeoutMs = 1000;
      await getMongoLock(key, timeoutMs);

      await expect(getMongoLock(key, timeoutMs)).rejects.toThrow(`LockObtainFail(${key})`);
    });
    it('should execute the function and release the lock', async () => {
      const key = 'test-key-2';
      const timeoutMs = 1000;
      const mockFunc = jest.fn();

      await withMongoLock(key, timeoutMs, mockFunc);

      expect(mockFunc).toHaveBeenCalledTimes(1);
      const lock = await LockModel.findOne({ key });
      expect(lock).toBeNull();
    });

    it('should release the lock even if the function throws an error', async () => {
      const key = 'test-key-3';
      const timeoutMs = 1000;
      const mockFunc = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(withMongoLock(key, timeoutMs, mockFunc)).rejects.toThrow('Test error');
      const lock = await LockModel.findOne({ key });
      expect(lock).toBeNull();
    });
  });
});
