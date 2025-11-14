export function parseArgs() {
    const args = process.argv.slice(2); // skip "node index.js"

    const map = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith("-")) {
            const key = args[i].replace(/^-+/, "");
            const value = args[i + 1] && !args[i + 1].startsWith("-")
                ? args[i + 1]
                : true;
            map[key] = value;
        }
    }

    return map;
}
