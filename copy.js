#!/usr/bin/env node
const fs = require('fs');
const glob = require('glob');
const path = require('path');

function cp(args) {
	args = args.slice(2);		// drop node index.js
	var dest = args.pop();		// destination
	var isDestDir;
	var src = [];

	// Expand globs in src
	var globbed = 0;
	args.map(arg => {
		globbed++;
		glob(arg, {}, (err, files) => {
			if (!err) {
				src = src.concat(files.length ? files : arg);
			} else {
				console.log('ERROR: ' + err);
				process.exit(1);
			}
			globbed--;
			if (!globbed) finishedGlobbing();
		});
	});

	function finishedGlobbing() {
		fs.lstat(dest, function(err, stats) {
			if (!err) isDestDir = stats.isDirectory();
			if (src.length > 1 && !isDestDir) {
				console.error('ERROR: destination must be directory');
				process.exit(1);
			} 
			startCopy();
		});
	}

	function startCopy() {
		var copied = 0;
		src.map(from => {
			copied ++;
			copyToDest(from).then(() => {
				copied --;
				if (copied === 0) finished();
			}).catch((e) => {
				console.log(e);
				copied --;
				if (copied === 0) finished();
			});
		});
	}

	function copyToDest(from) {
		var to = isDestDir ? path.join(dest, path.basename(from)) : dest;
		console.log(from + ' -> ' + to);
		var rd = fs.createReadStream(from);
		var wr = fs.createWriteStream(to);
		return new Promise(function(resolve, reject) {
			rd.on('error', reject);
			wr.on('error', reject);
			wr.on('finish', resolve);
			rd.pipe(wr);
		}).catch(function(error) {
			rd.destroy();
			wr.end();
			throw error;
		});
	}

	function finished() {
		process.exit(0);
	}
}

cp.call(this, process.argv);
