import * as fs from 'fs';
import * as path from 'path'
import * as vscode from 'vscode';

export class FileInfo {
    file: string;
    isFile: boolean;
    
    constructor(dir: string, file: string) {
        this.file = file;
        this.isFile = fs.statSync(path.join(dir, file)).isFile();
    }
}

export function fileExists(dir, file) {
  var fullpath = path.join(dir, file)
  return fs.existsSync(fullpath) && fs.statSync(fullpath).isFile();
}

export function getChildren(startPath: string, maxResults?: number) {
    return readdir(startPath)
        .then(files => files.filter(notHidden).map(f => new FileInfo(startPath, f)))
        .catch(() => []);
}

export function getChildFiles(include: string, maxResults?: number) {
  return vscode.workspace.findFiles(include, '', maxResults)
}

export function getPath(fileName: string, text: string) : string {
  var filedir = path.dirname(fileName);
  if (text.startsWith("/") || text.startsWith("\\")) {
      text = '.' + text;
  }
  var textdir = path.dirname(text);
  return path.resolve(filedir, textdir);
}

export function getExt(document: vscode.TextDocument) {
    if (document.isUntitled) {
        return undefined;
    }

    return path.extname(document.fileName)
}

function readdir(path: string) {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (error, files) => {
            if(error){
                reject(error);
            } else {
                resolve(files);
            }
        });
    });
}

function notHidden(filename) {
    return filename[0] !== '.';
}