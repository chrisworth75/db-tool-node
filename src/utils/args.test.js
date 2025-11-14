import { parseArgs } from './args.js';

describe('parseArgs', () => {
    const originalArgv = process.argv;

    afterEach(() => {
        process.argv = originalArgv;
    });

    it('should parse single flag argument', () => {
        process.argv = ['node', 'index.js', '--ccd', '12345'];
        const result = parseArgs();
        expect(result).toEqual({ ccd: '12345' });
    });

    it('should parse multiple arguments', () => {
        process.argv = ['node', 'index.js', '--ccd', '12345', '--verbose', 'true'];
        const result = parseArgs();
        expect(result).toEqual({ ccd: '12345', verbose: 'true' });
    });

    it('should handle boolean flags without values', () => {
        process.argv = ['node', 'index.js', '--verbose'];
        const result = parseArgs();
        expect(result).toEqual({ verbose: true });
    });

    it('should handle flags with single dash', () => {
        process.argv = ['node', 'index.js', '-v'];
        const result = parseArgs();
        expect(result).toEqual({ v: true });
    });

    it('should handle multiple dashes in flag name', () => {
        process.argv = ['node', 'index.js', '---test', 'value'];
        const result = parseArgs();
        expect(result).toEqual({ test: 'value' });
    });

    it('should return empty object when no arguments provided', () => {
        process.argv = ['node', 'index.js'];
        const result = parseArgs();
        expect(result).toEqual({});
    });

    it('should handle consecutive flags as boolean', () => {
        process.argv = ['node', 'index.js', '--flag1', '--flag2'];
        const result = parseArgs();
        expect(result).toEqual({ flag1: true, flag2: true });
    });

    it('should handle mixed flags and values', () => {
        process.argv = ['node', 'index.js', '--name', 'test', '--verbose', '--count', '5'];
        const result = parseArgs();
        expect(result).toEqual({ name: 'test', verbose: true, count: '5' });
    });
});
