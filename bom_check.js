#!/usr/bin/env node
//@ts-check

const fs = require('fs');
const path = require('path');

const bom_types = [
    "EFBBBF",
    "FEFF",
    "FFFE",
    "00FEFF",
    "FFFE00",
    "2B2F7638",
    "2B2F7639",
	"2B2F762B",
	"2B2F762F",
	"2B2F76382D",
	"F7644C",
	"DD736673",
	"0EFEFF",
	"FBEE28",
    "84319533"];

const max_len = Math.max.apply(null, bom_types.map(x => x.length / 2));
const hexmap = "0123456789ABCDEF".split("");
function read_head( file, cb ) {
    let buffer = Buffer.alloc(max_len);
    console.log(` -- ${file}`);
    fs.open(file, "r", (err, fd)=>{
        if(err) {
            if(cb) cb(err);
            return;
        }
        fs.read(fd, buffer, 0, max_len, 0, (err, bytes, buffer)=>{

            let uint8array = new Uint8Array(buffer);
            let string = uint8array.map(x=>hexmap[x>>4] + hexmap[x & 0xFF]).join("");
            let matchCnt = bom_types.filter(x => string.startsWith(x)).length;
            if(matchCnt> 0) {
                console.log(`${file} match ${matchCnt}`);
            }

            fs.closeSync(fd);
        });

    });
}

function walk_dir(dir, cb) {
    let files = fs.readdirSync(dir);
    for(let f of files) {
        if(f == "." || f == "..") continue;
        let fpath = path.join(dir,f);
        let stat = fs.statSync(path.join(dir, f));
        if(stat.isSymbolicLink()) {
            continue;
        } else if(stat.isFile()) {
            read_head(fpath, cb); 
        } else if(stat.isDirectory()) {
            walk_dir(fpath);
        }
    }
}

walk_dir(process.argv[2], (err)=>{
    if(err) {
        console.log(`error ${err} occurs!`);
        return;
    }
});


