#!/usr/bin/env node

import { exec } from "child_process";
import { FileHandle, open } from "fs/promises";
import { homedir, platform as osPlatform } from "os";
import * as path from "path";

const platformData: Record<string, {
    clipboard: string;
    snippetPath: string[];
}> = {
    darwin: {
        clipboard: "pbpaste",
        snippetPath: ["Library", "Application", "Support"]
    },
    win32: {
        clipboard: "powershell Get-Clipboard",
        snippetPath: ["AppData", "Roaming"]
    },
    linux: {
        clipboard: "xclip -o",
        snippetPath: [".config"]
    }
} as const;

type SupportedPlatformsType = keyof typeof platformData;
type OutputType<T> = {
    error: string | null;
    result: T
};
const platform: Readonly<SupportedPlatformsType> = osPlatform() as SupportedPlatformsType;
const isShortFlag: RegExp = /^-[hv]$/;
const commands = {
    add: {
        fn: add
    },
    move: {
        fn: move
    },
    open: {
        fn: openFile
    },
    "--help": {
        fn: help
    },
    "-h": {
        alias: "--help"
    },
    "--version": {
        fn: version
    },
    "-v": {
        alias: "--version"
    }
} as const;

function argumentErrorFunction(userArgs: string[], index: number, missingArg: string) {
    if (userArgs.length <= index + 1) {
        throw new Error(`Didn't provide ${missingArg}`);
    }
}
function cleanJsonComments(input: string) {
    return input.split("\n").filter(elem => !/^\t\/\/.*$/.test(elem)).join("\n");
}
function color(text: string, foreground?: number, background?: number): string {
    return `\x1b[38;5;${foreground};48;5;${background}m${text}\x1b[0m`;
}
function getArgs(): string[] {
    return process.argv.slice(2);
}
function getSnippetsDirectory(): string {
    return path.join(
        homedir(),
        ...platformData[platform].snippetPath,
        "Code",
        "User",
        "snippets"
    );
}
function makeJsonFilePath(input: string): string {
    return path.join(snippetDirectory, `${input}.json`);
}
async function getClipboard(): Promise<OutputType<string>> {
    const clipboardCommand = platformData[platform].clipboard;
    const output: OutputType<string> = {
        error: null,
        result: ""
    };

    return new Promise((res, rej) => {
        exec(clipboardCommand, (error, stdout, stderr) => {
            if (error || stderr) {
                console.error(error);
                console.error(stderr);
            } else {
                output.result = stdout;
            }

            res(output);
        });
    });
}
async function execute() {
    if (Object.keys(commands).includes(inputArgs[0])) {
        if (isShortFlag.test(inputArgs[0])) {
            await commands[commands[inputArgs[0]].alias].fn();
        } else {
            await commands[inputArgs[0]].fn();
        }
    } else {
        help();
    }
}
async function add() {
    const userArgs = inputArgs.slice(1);
    const newSnippet: Partial<{
        language: string;
        title: string;
        prefix: string;
        body: string[];
        description: string;
    }> = {};

    for (let index = 0; index < userArgs.length; ++index) {
        const elem = userArgs[index];
        let property = "";

        if (elem === "-l" || elem === "--language") {
            property = "language";
        } else if (elem === "-t" || elem === "--title") {
            property = "title";
        } else if (elem === "-p" || elem === "--prefix") {
            property = "prefix";
        } else if (elem === "-d" || elem === "--description") {
            property = "description";
        } else {
            continue;
        }
        
        try {
            argumentErrorFunction(userArgs, index, property);
        } catch (error) {
            console.error(error);
            return help();
        }
        
        newSnippet[property] = userArgs[++index];
    }

    if (newSnippet.language === undefined || newSnippet.prefix === undefined) {
        return help();
    }

    const { error, result } = await getClipboard();

    if (error !== null) {
        console.error(error);
        return help();
    } else if (result.trim() === "") {
        console.log(result);
        console.error("You copied nothing");
        return help();
    }

    newSnippet.body = result.split("\n");

    let fileHandle: FileHandle;
    const filePath = makeJsonFilePath(newSnippet.language);

    try {
        fileHandle = await open(filePath, "r+");
        
        const content = await fileHandle.readFile({ encoding: "utf-8" });
        const contentJSON = JSON.parse(cleanJsonComments(content));
        const date = (new Date()).toString();
        const newData = {
            [newSnippet.title ?? date]: {
                prefix: newSnippet.prefix,
                body: newSnippet.body,
                description: newSnippet.description ?? date
            }
        }

        await fileHandle.write(JSON.stringify({...contentJSON, ...newData}, null, 4), 0);

        console.log(`${newSnippet.language}.json has been modified`);
    } catch (error) {
        console.error(error);
    } finally {
        await fileHandle?.close();
    }
}
async function openFile() {
    const userArgs = inputArgs.slice(1);
    const filePath: string = path.join(snippetDirectory, `${userArgs[0]}.json`);

    await (new Promise((res, rej) => {
        exec(`code ${filePath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                console.error(error);
                console.error(stderr);
                rej("Error");
            }
            
            res("Success");
        });
    }));
}
function help() {
    console.log(`
snip [commands args]/[options]
                                
Commands:
add [-l/--language] <language> [-p/--prefix] <prefix> [-t/--title] <title> [-d/--description] <description>:
                               To add a new snippet to a snippet file

    --language/-l*             - Tell the language in which you are working

    --title/-t                 - Set the title for your snippet, it is displayed right next to your snippet when you type and don't press enter
                               - This will be the key of your snippet in the corresponding .json file

    --prefix/-p*               - This command will trigger the snippet

    --description/-d           - It adds a description for your snippet

    FOR EXAMPLE: snip add -l javascript -p pint -t "parseInt input" -d "Code to take integer input from the terminal"
    ${color("** Your code which you want to make snippet of must already be copied and be in your clipboard, that will be the body of the snippet", 0, 31)}
    ** Fields title and description are set to new Date() when you don't provide those fields, so it is recommended that you provide at least the title

move [-f/--from] <from> [-t/--to] <to>:
                               To move snippets from one file to the another, it doesn't erase existing snippets from the target file and just merges the two files into the target file

    --from/-f*                 - The file you are moving from, just write the language name

    --to/-t*                   - The file you want to move snippets in, just write the language name


** The arguments that are marked with (*) are necessary and an error will be returned if you don't set those args
open <language>:               To open a snippet file

Options:
--help, -h                     Show help
--version, -v                  Show version number
	`);
}
async function move() {
    const userArgs = inputArgs.slice(1);
    const files: Partial<{
        from: string;
        to: string;
    }> = {};

    for (let index = 0; index < userArgs.length; ++index) {
        const elem = userArgs[index];
        let property = "";

        if (elem === "-f" || elem === "--from") {
            property = "from";
        } else if (elem === "-t" || elem === "--to") {
            property = "to";
        } else {
            continue;
        }

        try {
            argumentErrorFunction(userArgs, index, property);
        } catch (error) {
            console.error(error);
            return help();
        }

        files[property] = userArgs[++index];
    }

    if (files.from === undefined || files.to === undefined) {
        return help();
    }

    const fromFilePath = makeJsonFilePath(files.from);
    const toFilePath = makeJsonFilePath(files.to);
    let fromFileHandle: FileHandle;
    let toFileHandle: FileHandle;

    try {
        fromFileHandle = await open(fromFilePath, "r");
        toFileHandle = await open(toFilePath, "r+");
        
        const fromContent = await fromFileHandle.readFile({ encoding: "utf-8" });
        const toContent = await toFileHandle.readFile({ encoding: "utf-8" });
        const fromContentJSON = JSON.parse(cleanJsonComments(fromContent));
        const toContentJSON = JSON.parse(cleanJsonComments(toContent));

        await toFileHandle.write(JSON.stringify({...toContentJSON, ...fromContentJSON}, null, 4), 0);

        console.log(`${files.to}.json has been modified`);
    } catch (error) {
        console.error(error);
        return help();
    } finally {
        await fromFileHandle?.close();
        await toFileHandle?.close();
    }
}
async function version() {
    const packageJsonPath = path.resolve(import.meta.dirname, "../package.json");
    
    let fileHandle: FileHandle;

    try {
        fileHandle = await open(packageJsonPath, "r");

        const content = await fileHandle.readFile({ encoding: "utf-8" });
        const contentJson = JSON.parse(content);

        console.log(contentJson.version);
    } catch (error) {

    } finally {
        await fileHandle?.close();
    }
}

const snippetDirectory = getSnippetsDirectory();
const inputArgs = getArgs();

await execute();