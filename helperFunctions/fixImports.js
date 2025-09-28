// fixImports.js

const fs = require("fs");
const path = require("path");

const ignoreDirs = ["node_modules", ".expo", "dist", "build", "coverage"];
const validExtensions = [".js", ".jsx", ".ts", ".tsx"];
const reactHooks = [
  "useState",
  "useEffect",
  "useCallback",
  "useMemo",
  "useRef",
  "useContext",
];

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

  // Collect imports from react-native
  const rnRegex = /import\s+\{([^}]*)\}\s+from\s+['"]react-native['"];?/g;
  let rnImports = [];
  let match;
  while ((match = rnRegex.exec(content)) !== null) {
    const parts = match[1]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    rnImports.push(...parts);
  }

  if (rnImports.length === 0) return; // nothing to fix

  // Separate hooks vs RN components
  const hooks = rnImports.filter((i) => reactHooks.includes(i));
  const others = rnImports.filter((i) => !reactHooks.includes(i));

  // Deduplicate & sort
  const uniqueHooks = Array.from(new Set(hooks)).sort();
  const uniqueOthers = Array.from(new Set(others)).sort();

  // Remove old imports
  content = content.replace(rnRegex, "");

  // Build new imports
  let newImports = "";
  if (uniqueHooks.length > 0) {
    newImports += `import { ${uniqueHooks.join(", ")} } from "react";\n`;
  }
  if (uniqueOthers.length > 0) {
    newImports += `import { ${uniqueOthers.join(", ")} } from "react-native";\n`;
  }

  // Insert cleaned imports at top of file
  content = newImports + content.trimStart();

  fs.writeFileSync(file, content, "utf8");
  console.log(`✨ Fixed: ${file}`);
}

const files = walk("./");
files.forEach(fixImports);

console.log("✅ All react/react-native imports standardized!");
