const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

const lastAppVersion = require('../src/environments/version.json').version;
const versionFilePath = path.join(__dirname + '/../src/environments/version.json');

var versionSegmants = lastAppVersion.split(/\s*-\s*/);
var newAppVersion;

console.log(colors.cyan('\nRunning pre-build tasks'));

if (versionSegmants.length === 2) {
    versionSegmants[1]++;
    newAppVersion = `{"version": "${versionSegmants[0]}-${versionSegmants[1]}"}`;
} else {
    newAppVersion = `{"version": "0.0.1-0" }`;
}

fs.writeFile(versionFilePath, newAppVersion, { flat: 'w' }, function (err) {
    if (err) { return console.log(colors.red(err)); }
    console.log(colors.green(`Updating application version to: ${colors.yellow(newAppVersion)}`));
    console.log(`${colors.green('Writing version module to: ')}${colors.yellow(versionFilePath)}\n`);
});