#!/usr/bin/env node
//@ts-check

const fs = require('fs');
const path = require('path');

const bom_types_map = {
    "EFBBBF": "UTF8", 
    "FEFF": "UTF-16 BE",
    "FFFE": "UTF-16 LE",
    "00FEFF": "UTF-32 BE",
    "FFFE00": "UTF-32 LE",
    "2B2F7638": "UTF-7 1",
    "2B2F7639": "UTF-7 1",
	"2B2F762B": "UTF-7 1",
	"2B2F762F": "UTF-7 1",
	"2B2F76382D": "UTF-7 1",
	"F7644C":"UTF-1",
	"DD736673":"UTF-EBCDIC",
	"0EFEFF":"SCSU",
	"FBEE28":"BOCU-1",
    "84319533":"GB-18030"
};

const bom_types = Object.keys(bom_types_map);

const max_len = Math.max.apply(null, bom_types.map(x => x.length / 2));
const hexmap = "0123456789ABCDEF".split("");
function read_head( file, cb ) {
    //console.log(` -- ${file}`);
    return new Promise((resolve, reject)=>{
        let buffer = Buffer.alloc(max_len);
        fs.open(file, "r", (err, fd)=>{
            if(err) {
                if(cb) cb(err);
                reject(err);
                return;
            }
            fs.read(fd, buffer, 0, max_len, 0, (err, bytes, buffer)=>{
                if(err){
                    fs.closeSync(fd);
                    if(cb) cb(err);
                    reject(err);
                    return;
                }
                let uint8array = new Uint8Array(buffer);
                let string = "";
                uint8array.forEach(x=>{ 
                    string+=(hexmap[x>>4] + hexmap[x & 0x0F]);
                 //   console.log(`[] ${x >>4} - ${x & 0x0F}`);
                });
                let matchCnt = bom_types.filter(x => x.length <= string.length &&  string.startsWith(x));
                if(matchCnt.length> 0) {
                    //console.log(`${file} match ${matchCnt}`);
                    let relpath = path.relative(process.argv[2], file);
                    console.log(` - BOM: ${matchCnt.map(k => bom_types_map[k]).join("/")}\n    ${relpath}`);
                } else {
                  //  console.log(` . ${string} ${bytes}`)
                }
                fs.closeSync(fd);
                resolve();
            });
    
        });
    })
}

async function walk_dir(dir, cb) {
    let files = fs.readdirSync(dir);
    for(let f of files) {
        if(f == "." || f == "..") continue;
        let fpath = path.join(dir,f);
        let stat = fs.statSync(path.join(dir, f));
        if(stat.isSymbolicLink()) {
            continue;
        } else if(stat.isFile()) {
            await read_head(fpath, cb); 
        } else if(stat.isDirectory()) {
            walk_dir(fpath);
        }
    }
}

if(!fs.existsSync(process.argv[2])) {
    console.log("path not provided!");
    process.exit(2);
}

walk_dir(process.argv[2], (err)=>{
    if(err) {
        console.log(`error ${err} occurs!`);
        return;
    }
});


