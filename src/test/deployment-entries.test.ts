import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const configFile = ts.createSourceFile("vite.config.ts", readFileSync(resolve(root, "vite.config.ts"), "utf8"), ts.ScriptTarget.Latest, true);

function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression {
  const member = object.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(configFile) === name);
  if (!member || !ts.isPropertyAssignment(member)) throw new Error(`Missing deployment option: ${name}`);
  return member.initializer;
}
function object(expression: ts.Expression): ts.ObjectLiteralExpression {
  if (!ts.isObjectLiteralExpression(expression)) throw new Error("Expected a deployment options object");
  return expression;
}
function text(expression: ts.Expression): string {
  if (!ts.isStringLiteral(expression)) throw new Error("Expected an explicit deployment entry");
  return expression.text;
}
function options(): ts.ObjectLiteralExpression {
  const statement = configFile.statements.find(ts.isExportAssignment);
  if (!statement || !ts.isCallExpression(statement.expression)) throw new Error("Missing Vite configuration");
  const argument = statement.expression.arguments[0];
  if (!argument) throw new Error("Missing Vite configuration options");
  return object(argument);
}
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.[cm]?tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("Deployment source completeness", () => {
  it("resolves the configured router, startup and server entries from src", () => {
    const start = object(property(options(), "tanstackStart"));
    const src = text(property(start, "srcDirectory"));
    expect(src).toBe("src");
    for (const [name, expected] of [["router", "router.tsx"], ["start", "start.ts"], ["server", "server.ts"]] as const) {
      const entry = text(property(object(property(start, name)), "entry"));
      expect(entry).toBe(expected);
      expect(existsSync(resolve(root, src, entry))).toBe(true);
    }
  });

  it("uses Vercel output and reproducible install commands", () => {
    expect(text(property(object(property(options(), "nitro")), "preset"))).toBe("vercel");
    const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
    expect(vercel.installCommand).toBe("bun install --frozen-lockfile");
    expect(vercel.buildCommand).toBe("bun run build");
    expect(vercel.outputDirectory).toBeUndefined();
    expect(existsSync(resolve(root, "bun.lock"))).toBe(true);
  });

  it("includes every local module imported by pages, operations and animations", () => {
    const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const missing: string[] = [];
    let checked = 0;
    for (const file of sourceFiles(resolve(root, "src"))) {
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      function check(specifier: ts.Expression | undefined) {
        if (!specifier || !ts.isStringLiteral(specifier)) return;
        const name = specifier.text;
        if (!name.startsWith(".") && !name.startsWith("@/")) return;
        checked++;
        const local = name.split("?")[0] ?? name;
        const asset = local.startsWith("@/") ? resolve(root, "src", local.slice(2)) : resolve(dirname(file), local);
        if (!ts.resolveModuleName(name, file, parsed.options, ts.sys).resolvedModule && !existsSync(asset)) missing.push(`${file}: ${name}`);
      }
      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) check(node.moduleSpecifier);
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) check(node.arguments[0]);
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    expect(checked).toBeGreaterThan(50);
    expect(missing).toEqual([]);
  });
});