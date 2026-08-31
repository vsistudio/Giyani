import { mkdir, cp, copyFile } from 'node:fs/promises';
await mkdir('dist/src/styles',{recursive:true});
await copyFile('index.html','dist/index.html');
await cp('src','dist/src',{recursive:true});
console.log('Built static VEROS application to dist/');
