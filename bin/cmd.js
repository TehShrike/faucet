#!/usr/bin/env node

'use strict';

var faucet = require('../');
var minimist = require('minimist');
var defined = require('defined');

var fs = require('fs');
var path = require('path');

var regexTester = require('safe-regex-test');
var jsFile = regexTester(/\.js$/i);

var argv = minimist(process.argv.slice(2));
var tap = faucet({
	width: defined(argv.w, argv.width, process.stdout.isTTY
		? process.stdout.columns - 5
		: 0)
});
process.on('exit', function (code) {
	if (code === 0 && tap.exitCode !== 0) {
		process.exit(tap.exitCode);
	}
});
process.stdout.on('error', function () {});

if (!process.stdin.isTTY || argv._[0] === '-') {
	process.stdin.pipe(tap).pipe(process.stdout);
	return;
}

var files = argv._.reduce(function (acc, file) {
	if (fs.statSync(file).isDirectory()) {
		return acc.concat(fs.readdirSync(file).map(function (x) {
			return path.join(file, x);
		}).filter(jsFile));
	}
	return acc.concat(file);
}, []);

if (files.length === 0 && fs.existsSync('test')) {
	files.push.apply(files, fs.readdirSync('test').map(function (x) {
		return path.join('test', x);
	}).filter(jsFile));
}
if (files.length === 0 && fs.existsSync('tests')) {
	files.push.apply(files, fs.readdirSync('tests').map(function (x) {
		return path.join('tests', x);
	}).filter(jsFile));
}

if (files.length === 0) {
	console.error('usage: `faucet [FILES]` or `| faucet`\n');
	console.error('No test files or stdin provided and no files in test/ or tests/ directories found.');
	process.exit(1);
}
