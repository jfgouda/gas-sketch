const fs = require('fs');
var child_process = require('child_process');
const path = require('path');
const colors = require('colors/safe');
const webConfigPath = path.join(__dirname + '/../dist/web.config');
const distPath = path.join(__dirname + '/../dist/');


console.log(colors.cyan('\nRunning post-build tasks'));
fs.createReadStream('build/web.config').pipe(fs.createWriteStream(webConfigPath));
console.log(colors.green(`Web configuration copied to: ${colors.yellow(webConfigPath)}`));

child_process.exec('icacls ' + distPath + ' /grant "everyone":(OI)(CI)M /t');
console.log(colors.green(`Distribution folder permission changed to: ${colors.yellow("Everyone")}`));

child_process.exec('start chrome http://localhost/sketchgenerator/');
console.log(colors.green(`Application hosted on: ${colors.yellow("http://localhost/sketchgenerator/")}`));
