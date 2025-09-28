// fixReactNativeImports.js

const fs = require("fs");
const path = require("path");

const ignoreDirs = ["node_modules", ".expo", "dist", "build", "coverage"];
const validExtensions = [".js", ".jsx", ".ts", ".tsx"];

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat && stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        results = results.concat(walk(filepath));
      }
    } else if (validExtensions.includes(path.extname(file))) {
      results.push(filepath);
    }
  });
  return results;
}

function fixImports(file) {
  let content = fs.readFileSync(file, "utf8");
  const importRegex = /import\s+\{([^}]*)\}\s+from\s+['"]react-native['"];?/g;

  let match;
  let allImports = [];

  while ((match = importRegex.exec(content)) !== null) {
    const parts = match[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    allImports.push(...parts);
  }

  if (allImports.length > 0) {
    // Deduplicate & sort
    const uniqueImports = Array.from(new Set(allImports)).sort();

    const newImport = `import { ${uniqueImports.join(
      ", "
    )} } from "react-native";`;

    // Replace all react-native imports with one clean import
    content = content.replace(importRegex, "");
    content = newImport + "\n" + content.trimStart();

    fs.writeFileSync(file, content, "utf8");
    console.log(`✨ Fixed: ${file}`);
  }
}

const files = walk("./");
files.forEach(fixImports);

console.log("✅ All react-native imports have been standardized!");
