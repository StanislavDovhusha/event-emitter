/**
 * Type-level tests using the TypeScript language service (the same engine
 * IDEs use). Every check runs twice:
 *  - against the source (`index.ts`);
 *  - against the hand-written `index.d.ts`, which is what tsup ships in
 *    `dist/index.d.ts` (this is how 1.0.3 was published).
 */
import { describe, it, expect } from "vitest";
import ts from "typescript";
import * as runtime from "../index";

// Vitest runs from the project root (where vitest.config.ts lives).
const root = ts.sys.getCurrentDirectory();
const fixtureName = `${root}/test/__type_fixture__.ts`;
const shippedName = `${root}/test/__shipped__.d.ts`;
const shippedDts = ts.sys.readFile(`${root}/index.d.ts`)!;

const targets = [
  ["source (index.ts)", "../index"],
  ["shipped typings (index.d.ts)", "./__shipped__"],
] as const;

function analyze(source: string) {
  const config = ts.getParsedCommandLineOfConfigFile(`${root}/tsconfig.json`, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {},
  })!;
  const virtual: Record<string, string> = {
    [fixtureName]: source,
    [shippedName]: shippedDts,
  };
  const read = (f: string) => (f in virtual ? virtual[f] : ts.sys.readFile(f));

  const service = ts.createLanguageService({
    getCompilationSettings: () => config.options,
    getScriptFileNames: () => [fixtureName],
    getScriptVersion: () => "1",
    getScriptSnapshot: (f) => {
      const text = read(f);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => root,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: (f) => f in virtual || ts.sys.fileExists(f),
    readFile: read,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  });

  const format = (d: ts.Diagnostic) => ts.flattenDiagnosticMessageText(d.messageText, "\n");
  return {
    errors: ([] as ts.Diagnostic[])
      .concat(service.getSyntacticDiagnostics(fixtureName))
      .concat(service.getSemanticDiagnostics(fixtureName))
      .map(format),
    deprecations: service
      .getSuggestionDiagnostics(fixtureName)
      .filter((d) => d.reportsDeprecated)
      .map((d) => ({
        line: source.slice(0, d.start).split("\n").length,
        // The identifier the IDE renders with a strikethrough.
        target: source.substr(d.start!, d.length!),
        message: format(d),
      })),
  };
}

describe.each(targets)("type-level API checks: %s", (_, mod) => {
  it("1.0.3 user code compiles unchanged", () => {
    const { errors } = analyze(`
      import Eon, { EventEmitter, BehaviorEventEmitter, IObservable, ISubscription } from "${mod}";

      const e = new EventEmitter<number>();
      const s1: ISubscription = e.subscribe((v: number) => {});
      const s2: ISubscription = e.subscribeOnce((v: number) => {});
      const o: IObservable<number> = e.asObservable();
      const { subscribe, subscribeOnce } = e.asObservable();
      e.emit(1); const has: boolean = e.hasSubscribers();

      const b = new BehaviorEventEmitter<string>("x");
      const v: string | undefined = b.getValue();

      // User-defined IObservable implementations (only 2 members) remain valid.
      class MyObservable implements IObservable<number> {
        subscribe(cb: (v: number) => void): ISubscription { return { unsubscribe() {} }; }
        subscribeOnce(cb: (v: number) => void): ISubscription { return { unsubscribe() {} }; }
      }
      const plain: IObservable<number> = { subscribe: () => s1, subscribeOnce: () => s2 };

      // Subclassing still works, including protected getObservers().
      class Custom<T> extends EventEmitter<T> {
        count() { return this.getObservers().length; }
        subscribe(cb: (v: T) => void): ISubscription { return super.subscribe(cb); }
      }

      const E = Eon.EventEmitter; const B = Eon.BehaviorEventEmitter;
    `);
    expect(errors).toEqual([]);
  });

  it("subscribeOnce is reported as deprecated, subscribe and take are not", () => {
    const fixture = [
      `import { EventEmitter, BehaviorEventEmitter, IObservable, take } from "${mod}";`,
      `const e = new EventEmitter<number>();`,
      `e.subscribeOnce(() => {});`,
      `new BehaviorEventEmitter(1).subscribeOnce(() => {});`,
      `e.asObservable().subscribeOnce(() => {});`,
      `declare const o: IObservable<number>; o.subscribeOnce(() => {});`,
      `e.subscribe(() => {}); e.asObservable().pipe(take(1)).subscribe(() => {});`,
    ].join("\n");

    const { errors, deprecations } = analyze(fixture);

    expect(errors).toEqual([]);
    expect(deprecations.map((d) => d.line)).toEqual([3, 4, 5, 6]);
    for (const d of deprecations) {
      expect(d.target).toBe("subscribeOnce");
      expect(d.message).toContain("is deprecated");
    }
  });

  it("operators infer types through pipe", () => {
    const { errors } = analyze(`
      import { EventEmitter, Observable, OperatorFunction, filter, map, take } from "${mod}";
      const e = new EventEmitter<number>();

      const a: Observable<string> = e.asObservable().pipe(filter((v) => v > 1), map((v) => v.toFixed(1)), take(2));
      const b: Observable<boolean> = e.asObservable().pipe(filter((v) => v > 5), map((v) => v * 2), take(3), map((v) => v > 10));
      const c: Observable<number> = new EventEmitter<string | number>().asObservable().pipe(filter((v): v is number => typeof v === "number"));
      const op: OperatorFunction<number, string> = map((v: number) => String(v));
    `);
    expect(errors).toEqual([]);
  });

  it("type errors are detected in operator chains", () => {
    const { errors } = analyze(`
      import { EventEmitter, map, take } from "${mod}";
      const e = new EventEmitter<number>();
      e.asObservable().pipe(map((v: number) => v.toFixed(1))).subscribe((v: number) => {});
      e.asObservable().pipe(take("1"));
      e.asObservable().filter(() => true);
    `);
    expect(errors.length).toBe(3);
  });
});

describe("shipped typings", () => {
  it("keep every member declared in the published 1.0.3 typings (incl. removeAll)", () => {
    const { errors } = analyze(`
      import { EventEmitter } from "./__shipped__";
      const e = new EventEmitter<number>();
      const f: () => void = e.removeAll;
      e.unsubscribeAll();
    `);
    expect(errors).toEqual([]);
  });

  it("index.d.mts is identical to index.d.ts", () => {
    expect(ts.sys.readFile(`${root}/index.d.mts`)).toBe(shippedDts);
  });

  it("declare exactly the runtime exports", () => {
    const declared = shippedDts
      .slice(shippedDts.lastIndexOf("export {"))
      .replace(/export \{|\}|;|\btype\b/g, "")
      .split(",")
      .map((s) => s.trim().split(/\s+as\s+/).pop()!)
      .filter((name) => name && !["IObservable", "ISubscription", "OperatorFunction"].includes(name))
      .sort();

    // Vitest's per-file transform keeps type-only re-exports as `undefined`
    // keys; the tsup bundle does not, so only defined values are compared.
    const runtimeNames = Object.keys(runtime)
      .filter((k) => (runtime as Record<string, unknown>)[k] !== undefined)
      .sort();

    expect(declared).toEqual(runtimeNames);
    expect(Object.keys(runtime.default).sort()).toEqual(
      ["BehaviorEventEmitter", "EventEmitter", "Observable", "filter", "map", "take"]
    );
  });
});
