// scanBadImports.js
// This script scans all .js, .jsx, .ts, and .tsx files in the current directory and its subdirectories
// for bad imports of React hooks from 'react-native'. If any bad imports are found, it lists them. 

const fs = require("fs");
const path = require("path");

const badHooks = ["useCallback", "useEffect", "useState", "useMemo", "useRef", "useContext"];

function walk(dir, ext = [".js", ".jsx", ".ts", ".tsx"]) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory() && file !== "node_modules") {
      results = results.concat(walk(filepath, ext));
    } else if (ext.includes(path.extname(file))) {
      results.push(filepath);
    }
  });
  return results;
}

const files = walk("./");
let found = false;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");

  // Match only react-native import lines
  const matches = content.match(/import\s+{[^}]+}\s+from\s+['"]react-native['"]/g);

  if (matches) {
    matches.forEach((line) => {
      // Check only what’s inside { ... }
      const insideBraces = line.match(/{([^}]+)}/);
      if (!insideBraces) return;

      const imports = insideBraces[1].split(",").map((i) => i.trim());

      const badOnes = imports.filter((imp) => badHooks.includes(imp));
      if (badOnes.length > 0) {
        console.log("❌ Bad import found:", file);
        console.log(line);
        console.log("Bad symbols:", badOnes.join(", "));
        console.log("----------------------------------------------------");
        found = true;
      }
    });
  }
});

if (!found) {
  console.log("✅ No bad hook imports found!");
}
