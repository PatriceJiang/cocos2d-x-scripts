//@ts-check


let fs = require("fs");
let path = require("path");
let child_progress = require("child_process");

let cocos2dx_dir = path.join(__dirname, "../cocos2d-x");
let cocos2dx_bin_dir = path.join(__dirname, "../cocos2d-x-3rd-party-libs-bin");
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


function checkout_branch(dir, branch, cb) {
    let pwd = process.cwd();
    process.chdir(dir);
    log_progress(`fetch ${external_remote}`);
    let cmd_fetch = `git fetch ${external_remote}`;
    child_progress.exec(cmd_fetch, (err, stdout, stderr) => {
        if(err) {
            console.error(`failed to execute ${cmd_fetch}`);
            console.error(stderr);
            process.exit(-1);
        }
        log_progress(`checkout to ${branch}`);
        let cmd_checkout = `git checkout ${branch}`;
        child_progress.exec(cmd_checkout, (err, stdout, stderr) => {
            if(err) {
                console.error(`failed to execute ${cmd_checkout}`);
                console.error(stderr);
                process.exit(-1);
            }
            cb();
        });

    });
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

    log_progress("check tag");
    let external_tag = "";
    let cfg = require(external_config);
    if(!cfg || !cfg.version) {
        console.error(`can not read version from ${external_config}!`);
        process.exit(-1);
    }
    log_progress("tag: "+cfg.version.trim());

    checkout_branch(cocos2dx_bin_dir, cfg.version.trim(), do_copy);
}


main();



