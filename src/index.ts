const CompilerModule = require('./wasmlib/funcfiftlib.js');

/*
 * CompilerConfig example:
 * {
 *      sources: {
 *          "stdlib.fc": "<stdlib code>",
 *          "contract1: "<contract1 code>",
 *          ...
 *      },
 *      optLevel: number of <0-2> (recommend 2)
 * }
 *
 */
export type CompilerConfig = {
    sources: { [filename: string]: string },
    optLevel: number
};

export type SuccessResult = {
    status: "ok",
    codeBoc: string,
    fiftCode: string
};

export type ErrorResult = {
    status: "error",
    message: string
};

export type CompileResult = SuccessResult | ErrorResult;

export type CompilerVersion = {
    funcVersion: string,
    funcFiftLibCommitHash: string,
    funcFiftLibCommitDate: string
}

export async function compilerVersion(): Promise<CompilerVersion> {
    let mod = await CompilerModule();

    let versionJsonPTR = mod._version();

    let versionJson = mod.UTF8ToString(versionJsonPTR);

    mod._free(versionJsonPTR);

    return JSON.parse(versionJson);
}

export async function funcCompile(compileConfig: CompilerConfig): Promise<CompileResult> {
    let mod = await CompilerModule();

    let sourcesArr: string[] = [];

    mod.FS.mkdir("/contracts");

    for (let fileName in compileConfig.sources) {
        let source = compileConfig.sources[fileName]
        sourcesArr.push(`/contracts/${fileName}`);
        mod.FS.writeFile(`/contracts/${fileName}`, source);
    }

    let configJson = JSON.stringify({
        sources: sourcesArr,
        optLevel: compileConfig.optLevel
    });

    let configJsonPTR = mod._malloc(configJson.length + 1);
    mod.stringToUTF8(configJson, configJsonPTR, configJson.length + 1);

    let retPTR = mod._func_compile(configJsonPTR);

    mod._free(configJsonPTR);

    let retJson = mod.UTF8ToString(retPTR);

    mod._free(retPTR);

    return JSON.parse(retJson);
}