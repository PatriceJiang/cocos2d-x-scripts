#!/usr/bin/env node

//@ts-check


let fs = require("fs");
let path = require("path");
let child_progress = require("child_process");

let cocos2dx_dir = path.join(__dirname, "../cocos2d-x-lite");
let cocos2dx_bin_dir = path.join(__dirname, "../cocos2d-x-lite-external");
let external_config = path.join(cocos2dx_dir, "external/config.json");
let external_dir = path.join(cocos2dx_dir, "external");
let external_remote = "origin"

//condition tests
function ensure_exists(p) {
    if(!fs.existsSync(p)) {
        console.error(`path ${p} does not exists!`);
        process.exit(-1);
    }
}

function log_progress(msg)
{
    console.log(`[info] ${msg}`);
}

function use_tar() {
    log_progress("copy with tar");
    let cmd = `tar -c --exclude .git . | tar -x -C ${external_dir}`;
    child_progress.exec(cmd, (err, stdout, stderr)=>{
        if(err) {
            console.error(`failed to execute ${cmd}`);
            console.error(stderr);
            process.exit(-1);
        }
        log_progress("ok");
    });
}

function use_rsync() {
    log_progress("copy with rsync");
    let cmd = `rsync -rc --exclude .git * ${external_dir}`;
    child_progress.exec(cmd, (err, stdout, stderr)=>{
        if(err) {
            console.error(`failed to execute ${cmd}`);
            console.error(stderr);
            process.exit(-1);
        }
        log_progress("ok");
    });
}


function do_copy() {
    child_progress.exec("env rsync --version", (err, stdout, stderr)=>{
        if(err) {
            log_progress("can not find rsync, try tar!");
            use_tar();
            return;
        }
        use_rsync();
    })
}

function main() {
    //conditions tests
    log_progress("checking dirs");
    ensure_exists(cocos2dx_bin_dir);
    ensure_exists(cocos2dx_dir);
    ensure_exists(external_config);
    process.chdir(cocos2dx_bin_dir);
    do_copy();
}


main();



