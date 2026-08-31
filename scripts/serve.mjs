import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const root=process.cwd(); const port=process.env.PORT||5173; const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css'};
createServer((req,res)=>{const url=new URL(req.url,'http://localhost'); let file=normalize(join(root,url.pathname==='/'?'index.html':url.pathname)); if(!file.startsWith(root)||!existsSync(file)) file=join(root,'index.html'); res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream'); createReadStream(file).pipe(res);}).listen(port,()=>console.log(`VEROS listening on http://localhost:${port}`));
