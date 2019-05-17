import { initializeEnvironment, scan } from "./typeParser";

const { source, typeChecker, manager } = initializeEnvironment(
  "./src/query.d.ts",
  ["./src/schema.d.ts"]
);

scan(typeChecker, manager)(source);

console.dir(manager.getRegistry(), { depth: 5 });
