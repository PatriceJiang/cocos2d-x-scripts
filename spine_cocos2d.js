#!/usr/bin/env node

// @ts-check

let fs = require("fs");
let os = require("os");
let path = require("path");

let echo = console.log;

/*
process.argv
[0] - $NODE
[1] - script file name
[2] - first arg
[3] - second arg
etc.

envirments
let root = process.env["SPINE_ROOT"];
*/

let SPINE_ROOT = path.join(__dirname, "spine-runtimes");
let COCOS2DX_ROOT = path.join(__dirname, "cocos2d-x");

const VERSION_OF_COCOS2DX = "v4";

let spine = {
    cxx: "spine-cpp/spine-cpp",
    cocos2dx: "spine-cocos2dx/src/spine",
    v3: "spine-cocos2dx/src/spine/v3",
    v4: "spine-cocos2dx/src/spine/v4"
};


let cocos2dx = {
    spine: "cocos/editor-support/spine",
    cmake_prefix: "editor-support/spine"
};

function parseSpineTree() {
    function walk(fn, mp) {
        let stat = fs.statSync(fn);
        if (!stat) {
            return;
        }
        if (stat.isFile() && (fn.endsWith(".c") || fn.endsWith(".cpp") || fn.endsWith(".h"))) {
            mp[path.basename(fn)] = fn;
        } else if (stat.isDirectory()) {
            let files = fs.readdirSync(fn);
            for (let f of files) {
                walk(path.join(fn, f), mp);
            }
        }
    }
    let mp = {};
    walk(path.join(SPINE_ROOT, spine.cxx), mp);
    //walk(path.join(SPINE_ROOT, spine.cocos2dx), mp);
    return mp;
}

function getVersion(v) {
    let version;
    if(v == "3" || v == "v3" || v == "V3") {
        version = spine.v3;
    } else {
        version = spine.v4;
    }
    version = path.join(SPINE_ROOT, version);
    let root = path.join(SPINE_ROOT, spine.cocos2dx);
    let level1 = [];
    fs.readdirSync(root).forEach(x => {
        let stat = fs.statSync(path.join(root, x));
        if(stat.isFile() && !x.startsWith(".")){
            level1.push(path.join(root, x));
        }
    });

    fs.readdirSync(version).forEach(x => {
        if(!x.startsWith(".")){
            level1.push(path.join(version, x));
        }
    });
    return level1;
}



function cpSpineToCocos2dx() {
    // remove cocos spine folder
    let dstDir = path.join(COCOS2DX_ROOT, cocos2dx.spine);
    let listToRemove = fs.readdirSync(dstDir);
    listToRemove = listToRemove.filter(x => !x.startsWith("."));
    listToRemove.forEach(x => fs.unlinkSync(path.join(dstDir, x)));
    // build filename map, fileName -> fullPath
    let spineFileMap = parseSpineTree();

    for (let fn in spineFileMap) {
        fs.copyFileSync(spineFileMap[fn], path.join(dstDir, fn));
    }

    let v4files = getVersion(VERSION_OF_COCOS2DX);
    echo("v4 files ", v4files);
    for(let fn of v4files) {
        fs.copyFileSync(fn, path.join(dstDir, path.basename(fn)));
    }

    generateCMakeForCocos2d();
}

function cpCocos2dxToSpine() {
    let srcDir = path.join(COCOS2DX_ROOT, cocos2dx.spine);
    let spineFileMap = parseSpineTree();
    let srcFiles = fs.readdirSync(srcDir);
    for (let fn of srcFiles) {
        // echo("tospine ", fn);
        let srcFile = path.join(srcDir, fn);
        if (spineFileMap[fn]) {
            fs.copyFileSync(srcFile, spineFileMap[fn]);
        }
    }

    let v4files = getVersion(VERSION_OF_COCOS2DX);
    let map = {};
    v4files.forEach(f => {
        map[path.basename(f)] = f;
    });

    for(let fn in map) {
        let srcFile = path.join(srcDir, fn)
        fs.copyFileSync(srcFile, map[fn]);
    }

}
let template = `
include_directories(editor-support)

set(COCOS_SPINE_HEADER
    ###1
    )

set(COCOS_SPINE_SRC
    ###2
    )
`;

function generateCMakeForCocos2d() {
    let dstDir = path.join(COCOS2DX_ROOT, cocos2dx.spine);
    let files = fs.readdirSync(dstDir);
    let headers = [];
    let sources = [];
    for(let f of files) {
        if(f.endsWith(".c") || f.endsWith(".cpp")) {
            sources.push(cocos2dx.cmake_prefix + "/" + f);
        } else if (f.endsWith(".h")) {
            headers.push(cocos2dx.cmake_prefix + "/" + f);
        }
    }
    let content = template.replace("###1", headers.join("\n    "));
    content = content.replace("###2", sources.join("\n    "));
    fs.writeFileSync(path.join(dstDir, "CMakeLists.txt"), content);
}

let args = process.argv.slice(2);

if(args.length == 0)
{
    args.push("help");
}

for(let arg of args)
{
    if(arg == "update")
    {
        echo("update spine runtime through external source");
        cpSpineToCocos2dx();
        break;
    }else if(arg == "save")
    {
        echo("sync modification to external source");
        cpCocos2dxToSpine();
        break;
    }
    else{
        echo("help: ");
        echo(" update - copy from spine to cocos2dx");
        echo(" save   - copy from cocos2dx to spine");
    }
}




