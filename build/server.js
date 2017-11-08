(function () {
  const express = require("express");
  const app = express();
  const colors = require('colors/safe');
  const child_process = require('child_process');
  const port = 1000;

  console.log(colors.cyan('\nRunning post-build tasks'));

  app.use(express.static(__dirname + "/../dist"));
  app.listen(port);
  child_process.exec('start chrome http://localhost:' + port);

  console.log(colors.green(`Application hosted using Node.js on: ${colors.yellow("http://localhost:" + port)}`));
})();