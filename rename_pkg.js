#!/usr/bin/env node


const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const xml2js = require("xml2js");
const assert = require("assert");

let cwd = process.cwd();

let newPackageName = "org.xx.sdf";
let newAppName = "WhatEverApp";

process.argv.shift();
process.argv.shift();

if(process.argv.length < 2) {
    console.error("arg1 pkgname");
    console.error("arg2 appName");
    process.exit(-1);
}

newPackageName = process.argv[0];
newAppName = process.argv[1];

if(!/(\w+)(\.\w+)+/.test(newPackageName)) {
    console.error("pkgname format error!");
    console.error(`input "${newPackageName}" mismatch xx.xx.xx `);
    process.exit(-1);
}


let packageName = "";
let activityName = "";

function info() {
    let args = Array.prototype.slice.call(arguments, 0);
    args.unshift("[info]");
    console.log.apply(console, args);
}

function find(filename) {

    let fn = filename;
    let multipart = false;
    if(filename.indexOf("/") >=0 ) {
        let parts = filename.split("/");
        fn = parts[parts.length - 1];
        multipart = true;
    }
    let cmd = ""
    if(multipart) {
        cmd = `find ${cwd} -name "${fn}" | grep "${filename}"`;
    } else {
        cmd = `find ${cwd} -name "${fn}"`;
    }
    // console.log(cmd);
    let lines = child_process.execSync(cmd).toString().split("\n").map(x=> x.trim()).filter(x => x.length > 0);

    if(lines.length == 1) {
        return lines[0];
    }else {
        console.error(`[error] find ${lines.length} file ${filename}`);
        console.error(lines);
        process.exit(-1);
    }
}

function parseManifest(fn) {
    let parser = new xml2js.Parser()
    let content = fs.readFileSync(fn).toString();
    parser.parseString(content, (error, result)=>{
        //console.log(result);
        if(error) {
            console.error(`failed to parse ${error}`);
            process.exit(-1);
        }
        packageName = result["manifest"]["$"]["package"];
        activityName = result["manifest"]["application"][0]["activity"][0]["$"]["android:name"];

        assert(packageName.length > 0 && activityName.length > 0,
            `package name & activity name should be not empty!`);
        activityName = activityName.substr(1); //remove the leading dot in path
        info("package name:", packageName);
        info("activity name:", activityName);
    });
    //console.log("finish parsing ??");
}

function sed(fn, from, to) {
    info(`replace ${from} with ${to} in ${fn}`);
    child_process.execSync(`sed -i -s s/${from}/${to}/g ${fn}`);
    info(" replace done!");
}

function sedJavaSourceInFolder(folder, from ,to) {
    let files = fs.readdirSync(folder).filter(x => x.endsWith(".java"));
    info("sed java source");
    for(let f of files) {
        sed(path.join(folder,f), from, to);
    }
}

function renamePackage(folder, newPkg) {
    info(`rename package to ${newPkg}!`);

    let srcRoot = path.join(folder, packageName.split(".").map(x=>"..").join("/"));
    srcRoot = path.normalize(srcRoot);
    if("source root is ", srcRoot);

    let newPath = path.join(srcRoot, newPkg.replace(/\./g, "/"));
    let tmpdirname = path.join(process.cwd(),"_tmp");
    if(fs.existsSync(tmpdirname)) {
        child_process.execSync(`rm -rf ${tmpdirname}`);
    }
    //ensure no other files in each level
    fs.mkdirSync(tmpdirname);
    child_process.execSync(`cp -r ${folder}/* "${tmpdirname}/"`);

    child_process.execSync(`rm -rf ${srcRoot}/*`);

    child_process.execSync(`mkdir -p ${newPath}`)

    child_process.execSync(`cp -r ${tmpdirname}/* ${newPath}`);

    child_process.execSync(`rm -rf ${tmpdirname}`);
}

function updateAppName(fn) {
    let p = new xml2js.Parser()
    p.parseString(fs.readFileSync(fn).toString(), (err, data) => {
        if(err) {
            console.error("failed to parse", fn);
            process.exit(-1);
        }
        // console.log(data);
        let found = false;
        for(let x of data["resources"]["string"]) {
            if(x["$"]["name"] == "app_name") {
                // console.log("found item");
                // console.log(x);
                x["_"] = newAppName;
                found = true;
                break;
            }
        }

        if (found) {
            let b = new xml2js.Builder();
            let c = b.buildObject(data);
            fs.writeFileSync(fn, c);
        }
    });
}

function ensures(folder) {
    let parts = packageName.split(".");
    parts.length = parts.length - 1;
    let srcRoot = path.join(folder, packageName.split(".").map(x=>"..").join("/"));
    srcRoot = path.normalize(srcRoot);
    info(`each folder within ${parts.join("/")} should not contains more than one subfolders`);
    let p = srcRoot;
    while(parts.length > 0) {
        p = path.join(p, parts.shift());
        let list = fs.readdirSync(p);
        if(list.length > 1) {
            console.error(`there are more than 1 sub-directory here ${p}`);
            console.error(list);
            process.exit(-1);
        }
    }
}

function main() {
    info(`searching for AndroidManifest.xml ... `);
    let manifestPath = find("AndroidManifest.xml");
    info(`find manifest path ${manifestPath}`);
    
    parseManifest(manifestPath);

    let entryClass = find(`${activityName}.java`);
    info(`entry class path is ${entryClass}`);

    let gradleConfig = find(`app/build.gradle`);
    info(`gradle file path is ${gradleConfig}`);

    let stringValues = find("strings.xml");
    info(`strings.xml ${stringValues} `);

    ensures(path.dirname(entryClass));

    updateAppName(stringValues);

    sed(gradleConfig, packageName, newPackageName);
    sed(manifestPath, packageName, newPackageName);
    
    sedJavaSourceInFolder(path.dirname(entryClass), packageName, newPackageName);
    
    renamePackage(path.dirname(entryClass), newPackageName);
}


main();