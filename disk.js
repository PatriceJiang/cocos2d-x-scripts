//@ts-check

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function Node(name, parent) {
    this.parent = parent;
    this.name = name || ".";
    this.is_file = false;
    this.children = [];
    this._cachePath = null;
    this.percent = 0;
    this.total_size = 0;
    this.deleted = false;
}

let proto = Node.prototype;

proto.getFullPath = function() {
    if(this._cachePath == null) {
        this._cachePath = this._getFullPath();
    }
    return this._cachePath;
};

proto._getFullPath = function() {
    if(path.isAbsolute(this.name)) {
        return this.name;
    }
    if(this.parent != null) {
        return path.join(this.parent.getFullPath(), this.name);
    } else {
        return path.join(__dirname, this.name);
    }
};

let K = 1024;
let M = K * K;
let G = K * M;
let P = K * G;

proto.getSize = function() {

    if(this.total_size > G) {
        return (this.total_size / G).toFixed(2) + "G";
    }else if(this.total_size > M) {
        return (this.total_size / M).toFixed(2) + "M";
    }else if(this.total_size > K) {
        return (this.total_size / K).toFixed(2) + "K";
    }else {
        return this.total_size + "B";
    }
}

proto.parse = function() {
    this.children = [];
    let st = null;
    try {
        st = fs.statSync(this.getFullPath());
        fs.accessSync(this.getFullPath(), fs.constants.R_OK);
    } catch(e) {
        console.error(e);
        this.name = "[bad] "+this.name;
        return;
    }
    if(st.isDirectory() && !st.isSymbolicLink()) {
        this.is_file = false;
        let fileList = fs.readdirSync(this.getFullPath());
        for(let f of fileList) {
            let n = new Node(f, this);
            n.parse();
            this.children.push(n);
            this.total_size +=  n.total_size;
        }
    } else if(st.isFile()){
        this.is_file = true;
        this.total_size = st.size;
    }
    this.updatePercent();
};

proto.updatePercent = function() {
    let total = 0;
    for(let p of this.children) {
        total += p.total_size;
    }
    if(total == 0) {
        return;
    }
    for(let p of this.children) {
        p.percent = p.total_size / total;
    }
    this.children.sort((x, y ) => y.total_size - x.total_size);
};

proto.toJSON = function() {
    if(this.is_file) {
        return {file: this.name, percent: this.percent};
    }else {
        return {dir: this.name, percent: this.percent, children: this.children.map(x => x.toJSON())};
    }
};

proto.rmrf = function() {
    
    if(this.deleted) return;


    console.log("[proecessing ] "+this.getFullPath());

    this.deleted = true;
    this.name = "[del]" + this.name;
    if(!this.is_file){
        for(let f of this.children) {
            f.rmrf();
        }
        try{
            console.log("[remove dir ] "+this.getFullPath());
            fs.accessSync(this.getFullPath(), fs.constants.W_OK);
            fs.rmdirSync(this.getFullPath());
        }catch(e){
            console.error(e);
        }
    }else{
        try{
            console.log("[remove file] "+this.getFullPath());
            fs.accessSync(this.getFullPath(), fs.constants.W_OK);
            fs.unlinkSync(this.getFullPath());
        }catch(e){
            console.error(e);
        }
    }
};



function display(n) {
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout);
    console.log("------------------------------------------");
    console.log(n.getFullPath() + " " + n.getSize());
    if(n.is_file) {
        //console.log("F@ "+n.name);
    }else{
        //console.log("D@ "+n.name);
        let idx = 0;
        for(let f  of n.children) {
            console.log(`${idx++}\t[${(f.percent*100).toFixed(2)}%  ${f.getSize()}] ${f.name}${f.is_file ? "" : "/"}`);
            if(idx > 30){
                break;
            }
        }
    }
}

let current_node = null;

function loop() {
    display(current_node);
    rl.question("input line number or command : ", (line) => {
        if(line == "q" || line == "exit" || line == "quit") {
            process.exit(0);
        }else if(line == "del") {
            rl.question("confirm to delete '"+current_node.getFullPath()+"' [yes/no]: ", (line)=>{
                if(line == "yes") {
                    current_node.rmrf();
                    loop();
                }else{
                    loop();
                }
            });
        } else if(line == ".." || line == "<" || line == "back") { //move to parent
            if(current_node.parent == null) {
                console.log("no parent");
                loop();
            }else{
                current_node = current_node.parent;
                loop();
            }
        } else if (line.match(/\d+/)) {
            let row = Number.parseInt(line);
            if(row >= 0 && row < current_node.children.length) {
                current_node = current_node.children[row];
                console.log("select " + current_node.name);
                loop();
            }else {
                console.error("incorrect index!");
                loop();
            }
        } else {
            console.error("Invalidate command?");
            loop();
        }

    })
}


function analysis(dir) {
    let n = new Node(dir, null);
    console.log("parsing ...");
    n.parse();
    current_node = n;
    loop();
}


if(process.argv.length >= 3) {
    process.argv.shift();
    process.argv.shift();
}else{
    console.error("argument `path` required!");
    process.exit(-1);
}

analysis(process.argv[0]);

