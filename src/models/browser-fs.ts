
const getFilesRecursively = async function* (entry: FileSystemFileHandle | FileSystemDirectoryHandle, rootDir: FileSystemDirectoryHandle): AsyncIterable<any> {
  if (entry.kind === "file") {

    yield ((await rootDir.resolve(entry)) || []).join('/');
    // const file = await entry.getFile();
    // if (file !== null) {
    //   // file.relativePath = getRelativePath(entry);
    //   yield file;
    // }
  } else if (entry.kind === "directory") {
    // const reader = entry.values();
    for await (const handle of (entry as any).values()) {
      yield* getFilesRecursively(handle, rootDir);
    }
  }
}
const arrayFromAsyncIterator = async function<T = any>(iterator: AsyncIterable<T>) {
  const array: T[] = [];
  for await (const item of iterator) {
    array.push(item);
  }
  return array;
}
async function _readdir(dirHandle: FileSystemDirectoryHandle, subpath?: string): Promise<string[]> {
  const entry = !subpath ? dirHandle : await dirHandle.getFileHandle(subpath || '');
  return await arrayFromAsyncIterator(getFilesRecursively(entry, dirHandle));
}
type PickDirParams = {
  // By specifying an ID, the browser can remember different directories for different IDs. If the same ID is used for another picker, the picker opens in the same directory.  
  id: string, 
  // A string that defaults to "read" for read-only access or "readwrite" for read and write access to the directory.
  mode: 'read' | 'readwrite', 
  // A FileSystemHandle or a well known directory ("desktop", "documents", "downloads", "music", "pictures", or "videos") to open the dialog in.
  startIn: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos', 
}
export async function pickDir(params?: Partial<PickDirParams>): Promise<FileSystemDirectoryHandle> {
  
  if (!('showDirectoryPicker' in window)) {
    throw new Error('当前浏览器不支持 showDirectoryPicker API');
  }
  return (window as any).showDirectoryPicker(params);
}

async function _writeFile(fileHandle: FileSystemFileHandle, contents: FileSystemWriteChunkType) {
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}
export async function dataURIToFile(dataURI, filename) {
  const response = await fetch(dataURI);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}
export function isDataURI(str: string) { // 通过检查字符串是否 dataURI
  return /^data:[^,\s]*,/i.test(str);
}

export class LocalDirFs {
  dirHandle?: FileSystemDirectoryHandle;
  constructor({ dirHandle }: { dirHandle?: FileSystemDirectoryHandle }) {
    this.dirHandle = dirHandle;
  }
  
  async checkDirHandle(): Promise<void> {
    if (!this.dirHandle) {
      this.dirHandle = await pickDir({ id: 'default', mode: 'readwrite' });
    }
  }
  static async fromPicker(_params?: {
    // By specifying an ID, the browser can remember different directories for different IDs. If the same ID is used for another picker, the picker opens in the same directory.  
    id?: string, 
    // A string that defaults to "read" for read-only access or "readwrite" for read and write access to the directory.
    mode?: 'read' | 'readwrite', 
    // A FileSystemHandle or a well known directory ("desktop", "documents", "downloads", "music", "pictures", or "videos") to open the dialog in.
    startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos', 
  }) {
    const params: { id: string; mode: 'read' | 'readwrite'; startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'; } = { id: 'default', mode: 'readwrite', ..._params };
    return new LocalDirFs({ dirHandle: await pickDir(params) });
  }
  async readdir(subpath?: string) {
    await this.checkDirHandle();
    return await _readdir(this.dirHandle!, subpath);
  }
  async readFile(subpath: string, options?: { encoding?: BufferEncoding | null }) {
    await this.checkDirHandle();
    const fileHandle = await this.dirHandle!.getFileHandle(subpath);
    return await fileHandle.getFile();
  }
  async writeFile(subpath: string, contents: FileSystemWriteChunkType) {
    await this.checkDirHandle();
    const fileHandle = await this.dirHandle!.getFileHandle(subpath, { create: true });
    if (typeof contents === 'string' && isDataURI(contents)) {
      contents = await dataURIToFile(contents, subpath);
    }
    return await _writeFile(fileHandle, contents);
  }
  async readJson<T = any>(subpath: string) {
    await this.checkDirHandle();
    const file = await this.readFile(subpath);
    return JSON.parse(await file.text());
  }
  async writeJson(subpath: string, data: any) {
    await this.checkDirHandle();
    return await this.writeFile(subpath, JSON.stringify(data, null, 2));
  }
  async getFileHandle(subpath: string, options?: { create?: boolean }) {
    await this.checkDirHandle();
    return await this.dirHandle!.getFileHandle(subpath, options);
  }
}