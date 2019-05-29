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

proto.parse = function() {
    this.children = [];
    let st = fs.statSync(this.getFullPath());
    if(st.isDirectory()) {
        this.is_file = false;
        let fileList = fs.readdirSync(this.getFullPath());
        for(let f of fileList) {
            let n = new Node(f, this);
            n.parse();
            this.children.push(n);
            this.total_size +=  n.total_size;
        }
    } else {
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
}

function display(n) {
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout);
    console.log("------------------------------------------");
    console.log(n.getFullPath());
    if(n.is_file) {
        //console.log("F@ "+n.name);
    }else{
        //console.log("D@ "+n.name);
        let idx = 0;
        for(let f  of n.children) {
            console.log(`${idx++}\t[${(f.percent*100).toFixed(2)}%] ${f.name}${f.is_file ? "" : "/"}`);
            if(idx > 12){
                break;
            }
        }
    }
}

let current_node = null;

function loop() {
    display(current_node);
    rl.question("input line number or command .. :", (line) => {
        if(line == "q" || line == "exit" || line == "quit") {
            process.exit(0);
        }
        else if(line == ".." || line == "<" || line == "back") { //move to parent
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


analysis("/home/jiang/Projects");
