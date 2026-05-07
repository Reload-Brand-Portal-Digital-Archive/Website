const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src'));
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace single quotes: 'http://localhost:5000/...' -> import.meta.env.VITE_API_URL + '/...'
  content = content.replace(/'http:\/\/localhost:5000(.*?)'/g, (match, p1) => {
    if (p1 === '') return 'import.meta.env.VITE_API_URL';
    return "import.meta.env.VITE_API_URL + '" + p1 + "'";
  });

  // Replace double quotes: "http://localhost:5000/..." -> import.meta.env.VITE_API_URL + "/..."
  content = content.replace(/"http:\/\/localhost:5000(.*?)"/g, (match, p1) => {
    if (p1 === '') return 'import.meta.env.VITE_API_URL';
    return 'import.meta.env.VITE_API_URL + "' + p1 + '"';
  });

  // Replace backticks: `http://localhost:5000...` -> `${import.meta.env.VITE_API_URL}...`
  content = content.replace(/`http:\/\/localhost:5000(.*?)`/g, (match, p1) => {
    return '`${import.meta.env.VITE_API_URL}' + p1 + '`';
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated: ' + file);
  }
});

console.log('Total files updated: ' + changedFiles);
