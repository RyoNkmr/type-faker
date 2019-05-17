import ts, { isTypeAliasDeclaration } from "typescript";
import { decorator } from "@babel/types";

// const sourcePath = "./src/example.d.ts";
const sourcePath = "./src/query.d.ts";
// const program = ts.createProgram([sourcePath], {});
const program = ts.createProgram(["./src/test.d.ts", sourcePath], {});
const typeChecker = program.getTypeChecker();
const source = program.getSourceFile(sourcePath);

type Maybe<T> = T | undefined
type TypeName = string
type Registry = Record<TypeName, TypeDefinition>
type TypeDefinition = { types: TypeName[] } | { props: Registry }
type Registerer = (type: TypeName, definition: TypeDefinition) => void;
type RegistryManager = {
  getRegistry: () => Registry
  register: Registerer
  isUnregisteredTypeName: (type: TypeName) => boolean
  isUnregisteredNode: (type: ts.Node) => boolean
}
const getType = (node: ts.Node) => {
  const type = typeChecker.getTypeAtLocation(node)
  return {
    type,
    typeName: typeChecker.typeToString(type)
  }
}

const createTypeRegistryManager = (): RegistryManager => {
  let registry: Registry = {};
  const register: Registerer = (type: TypeName, definition: TypeDefinition) => {
    registry = { ...registry, [type]: definition };
  };
  const isUnregisteredTypeName = (type: TypeName) => !registry.hasOwnProperty(type);
  const isUnregisteredNode = (node: ts.Node) => isUnregisteredTypeName(getType(node).typeName)

  return {
    getRegistry: () => registry,
    isUnregisteredTypeName,
    isUnregisteredNode,
    register
  };
};

const getTypeStrings = (type: ts.Type, node?: ts.Node) => (type.isUnionOrIntersection() ? type.types : [type]).map(type => typeChecker.typeToString(type, node))

const getProps = (node: ts.InterfaceDeclaration | ts.TypeLiteralNode): Registry => 
  node.members
  .filter((prop): prop is ts.PropertySignature => ts.isPropertySignature(prop))
  .reduce((props, prop) => {
    const key = ts.isIdentifier(prop.name) && ts.idText(prop.name)
    if(!key || !prop.type) {
      return props
    }
    const base = prop.questionToken ? ['undefined'] : []

    if(ts.isTypeReferenceNode(prop.type)) {
      // const resolve = (symbol: ts.Symbol)
      // const symbol = typeChecker.getSymbolAtLocation(prop.type.typeName)
      // const type = symbol && symbol.declarations.map(d => )
      // const tt = ts.isUnionTypeNode(prop.type) || ts.isIntersectionTypeNode(prop.type)
      // console.log(key, type, tt)
    }

    if (ts.isTypeLiteralNode(prop.type)) {
      return {
        ...props,
        [key]: {
          types: [getProps(prop.type), ...base]
        },
      }
    }
    if (ts.isUnionTypeNode(prop.type) || ts.isIntersectionTypeNode(prop.type)) {
      const types = prop.type.types.map(typeNode => typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode)))
      return {
        ...props,
        [key]: {
          types: [...types, ...base]
        },
      }
    }

    const types = getTypeStrings(typeChecker.getTypeAtLocation(prop), prop)
    return {
      ...props,
      [key]: {
        types: [...types, ...base],
      }
    }
  }, {})


const scan = (registryManager: RegistryManager, depth?: number) => {
  const executor = (node?: ts.Node): void => {
    if (node === undefined) {
      return;
    }
    if (ts.isSourceFile(node)) {
      return ts.forEachChild(node, executor);
    }

    if (ts.isInterfaceDeclaration(node)) {
      const id = ts.idText(node.name)
      return registryManager.register(id, {
        props: getProps(node),
      })
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const { name, type } = node;
      const id = ts.idText(name);

      if (ts.isTypeLiteralNode(type)) {
        return registryManager.register(id, {
          props: getProps(type),
        })
      }
      const types = (ts.isUnionTypeNode(type) ? type.types : [type])
          .map(t => typeChecker.typeToString(typeChecker.getTypeFromTypeNode(t)))
      registryManager.register(id, {
        types,
      })
    }
    ts.forEachChild(node, executor);
  };
  return executor;
};

const manager = createTypeRegistryManager();
scan(manager)(source);

console.dir(manager.getRegistry(), { depth: 5 });
