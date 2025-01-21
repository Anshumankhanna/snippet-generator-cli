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

const platform = osPlatform() as SupportedPlatformsType;
const isFlag: RegExp = /^-{1,2}.*$/;

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
function getClipboard(): Promise<OutputType<string>> {
    const clipboardCommand = platformData[platform].clipboard;
    const output: OutputType<string> = {
        error: null,
        result: ""
    };

    return new Promise((res) => {
        exec(clipboardCommand, (error, stdout, stderr) => {
            if (error || stderr) {
                console.error(error);
                console.error(stderr);
                output.error = "Something went wrong";
            } else {
                output.result = stdout.trim();
            }

            res(output);
        });
    });
}
function executeAll() {
    const userArgs = getArgs();
    const snippetDirectory = getSnippetsDirectory();

    userArgs.forEach(async (elem, index) => {
        if (elem === "-l" || elem === "--language") {
            if (userArgs.length <= index + 1) {
                return ;
            }
            
            const filePath = path.join(snippetDirectory, `${userArgs[index + 1]}.json`);

            let fileHandle: FileHandle;

            try {
                fileHandle = await open(filePath, 'r');
                const content = await fileHandle.readFile({ encoding: "utf-8" });
                console.log(content);
            } finally {
                fileHandle.close();
            }
        }
    });
}

executeAll();