//@ts-check

const fs = require('fs');
const child_process = require('child_process');

const CL = '\n'.charCodeAt(0);

let cfg = {
    adb_path: "",
    process: "cocos2dx"
};


if(cfg.process.length == 0) {
    console.error("[error] cfg.process should not be empty!");
    process.exit(-1);
}


function which(cmd , cb) {
    child_process.exec(`which ${cmd}`, (err, stdout, stderr) => {
        if(err) {
            cb(err, stderr);
        }else {
            cb(null, stdout);
        }
    });
}

let chunk_id = 0;

function Chunk(data) {
    this.id = chunk_id ++;
    this.pos = 0;
    this.data = data;
    this.next = null;
    this.prev = null;
}

Chunk.prototype.hasCL = function() {
    for(let i = this.pos; i < this.data.length; i++) {
        if(this.data[i] == CL) {
            return true;
        }
    }
    return false;
}

Chunk.prototype.seekCL = function() {

    if(this.remain() == 0) {
        console.log("[error] should not seek chunk with out data!");
        process.exit(-1);
    }

    let end = this.pos;
    for(let i = this.pos; i < this.data.length; i++) {
        if(this.data[i] == CL) {
            end = i;
            break;
        }
    }
    if(end == this.pos) {
        this.pos = end + 1;
        return Buffer.alloc(0);
    }
    
    let buf = Buffer.from(this.data.buffer, this.pos, end - this.pos);
    this.pos = end + 1;
    return buf;
}

Chunk.prototype.remain = function() {
    return this.data.length - this.pos;
}

Chunk.prototype.build = function() {
    if(this.pos == 0) return this.data;
    return Buffer.from(this.data, this.pos, this.data.length - this.pos);
}

function Spliter(pid) {
    this.pid = new RegExp(`\\s+${pid}\\s+`);
    this.chunk = null;
}

Spliter.prototype.push = function(chunk) {
    let c = new Chunk(chunk);
    if(this.chunk == null) {
        this.chunk = c;
        c.next = c.prev = c;
    }else{
        this.chunk.prev.next = c;
        this.chunk.prev = c;
        c.next = this.chunk;
    }

    while(this.hasData()){
        let line = this.drain(); 
        if(line && line.match(this.pid)) {
            console.log("* " + line);
        }else {
            //console.log("# " + line);
        }
    }
};

Spliter.prototype.pop = function() {
    let c = this.chunk;
    if (c == null) {
        return null;
    } else if(this.chunk == this.chunk.next) {
        this.chunk = null;
    } else {
        c.prev.next = c.prev;
        c.next.prev = c.next;
        this.chunk = c.next;
    }
    return c;
};

Spliter.prototype.any = function(cb) {
    let c = this.chunk;
    if(cb(c)) return true;
    c = c.next;
    while(c != this.chunk) {
        if(cb(c)) return true;
    }
    return false;
};

Spliter.prototype.hasData = function() {
    return this.any((chunk)=>{
        return chunk.hasCL();
    });
};

Spliter.prototype.drain = function() {
        
    while(this.chunk && this.chunk.remain() <=0) {
        this.pop();
    }

    let c = this.chunk;
    if(c == null) {
        return null;
    }

    let lineBuffers = [];
    while(!this.chunk.hasCL()){
        lineBuffers.push(this.pop().build());
    }
    lineBuffers.push(this.chunk.seekCL());

    let newBuffer = Buffer.concat(lineBuffers);
    if(newBuffer.length == 0) {
        console.error("[error] should not have 0 length!");
        //process.exit(-1);
    }
    return newBuffer.toString("UTF-8");
};

function filter_process(pid) {
    let cp = child_process.spawn(`${cfg.adb_path}`,["logcat","-v","bref"], {stdio:["ignore", "pipe", "ignore"]});
    let spliter = new Spliter(pid);
    cp.stdout.on("data", (chunk)=>{
        console.log(`[data] ${chunk.length}`);
        //console.log(chunk.toString("utf-8"));
        spliter.push(chunk);
    });
    cp.stdout.on("close", ()=>{
        console.log(`[info] child_process::stdout:pipe closed!`);
    });
}

function do_select_process() {
    let reg = new RegExp(cfg.process);
    let cmd = `${cfg.adb_path}  shell ps`;
    child_process.exec(cmd, function (err, stdout, stderr) {
        if(err) {
            console.error("[error] failed to execute " + cmd );
            console.error(stderr);
            process.exit(-1);
        }
        let lines = stdout.split("\n");
        let pidIndex = -1;
        let matchProcesses = [];
        {
            //locate PID field
            let firstLine = lines[0];
            let parts = firstLine.split(/\s+/);
            for(let n = 0; n < parts.length; n++) {
                if(parts[n].match(/^pid$/i)) {
                    pidIndex = n;
                    break;
                }
            }
            if(pidIndex < 0) {
                console.error("[error] can not find `PID` field in `adb shell ps` stdout!");
                process.exit(-1);
            }
        }
        lines.shift();
        for(let line of lines) {
            if(line.match(reg)) {
                console.log(`[info] found "${line}"`)
                matchProcesses.push(line.split(/\s+/)[pidIndex]);
            }
        }
        if(matchProcesses.length == 0) {
            console.error(`[error] no process match /${cfg.process}/`)
            process.exit(-1);
        }
        if(matchProcesses.length > 1){
            console.warn(`[warn] more than 1 process match /${cfg.process}/`);
            console.warn(`[warn] select first matched process!`);
        }

        console.log("[info] select pid "+matchProcesses[0]);

        filter_process(matchProcesses[0]);
    });
}

which("adb", (err, adb_path) => {
    if(err) {
        console.error(`[error] adb is not found on system!`);
        console.error(adb_path);
        process.exit(-1);
        return;
    }
    adb_path = adb_path.trim();
    console.log("[info] locate adb path '"+adb_path+"'");
    cfg.adb_path = adb_path;

    do_select_process();
});


