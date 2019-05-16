import ts, { isTypeAliasDeclaration } from "typescript";
import { decorator } from "@babel/types";

const sourcePath = "./src/hoge.d.ts";
const program = ts.createProgram([sourcePath], {});
const typeChecker = program.getTypeChecker();
const source = program.getSourceFile(sourcePath);

type Maybe<T> = T | undefined
type TypeName = string
type NativeType = string
type Registry = Record<TypeName, TypeDefinition>
type TypeDefinition =  {
  type: TypeName
  nativeTypes?: NativeType[]
  props?: Registry
}
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

const inspect = (node: ts.Node) => Object.entries({
  isTypeLiteralNode: ts.isTypeLiteralNode(node),
  isTypeNode: ts.isTypeNode(node),
  isTypeElement: ts.isTypeElement(node),
  isLiteralExpression: ts.isLiteralExpression(node),
  isTypeAliasDeclaration: ts.isTypeAliasDeclaration(node),
  isInterfaceDeclaration: ts.isInterfaceDeclaration(node),
  isIntersectionTypeNode: ts.isIntersectionTypeNode(node),
}).filter(([key, value]) => value)

const getTypeStrings = (type: ts.Type, node?: ts.Node) => (type.isUnionOrIntersection() ? type.types : [type]).map(type => typeChecker.typeToString(type, node))
const processTypes = (type: ts.Type, symbol?: ts.Symbol) => {
  return Object.entries({
    undefined: type.flags & ts.TypeFlags.Undefined || (symbol && symbol.flags & ts.SymbolFlags.Optional),
    null: type.flags & ts.TypeFlags.Null,
  }).filter(([, flag]) => flag).map(([key]) => key)
}

const getProps = (node: ts.InterfaceDeclaration | ts.TypeLiteralNode): Registry => 
  node.members
  .filter((prop): prop is ts.PropertySignature => ts.isPropertySignature(prop))
  .reduce((props, prop) => {
    const key = ts.isIdentifier(prop.name) && ts.idText(prop.name)
    if(!key || !prop.type) {
      return props
    }
    if (ts.isTypeLiteralNode(prop.type)) {
      return {
        ...props,
        [key]: getProps(prop.type),
      }
    }
    if (ts.isUnionTypeNode(prop.type) || ts.isIntersectionTypeNode(prop.type)) {
      const types = prop.type.types.map(typeNode => typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode)))
      return {
        ...props,
        [key]: types,
      }
      console.log(key)
    }

    const types = getTypeStrings(typeChecker.getTypeAtLocation(prop), prop)
    return {
      ...props,
      [key]: types,
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
    /*
    if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) {
      return;
    }
    */
    if (ts.isInterfaceDeclaration(node)) {
      const id = ts.idText(node.name)
      return registryManager.register(id, {
        type: id,
        props: getProps(node),
      })
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const { name, type } = node;
      const id = ts.idText(name);

      if (ts.isTypeLiteralNode(type)) {
        return registryManager.register(id, {
          type: id,
          props: getProps(type),
        })
      }
      const nativeTypes = (ts.isUnionTypeNode(type) ? type.types : [type])
          .map(t => typeChecker.typeToString(typeChecker.getTypeFromTypeNode(t)))
      registryManager.register(id, {
        type: id,
        nativeTypes,
      })
    }
    ts.forEachChild(node, executor);
  };
  return executor;
};

const manager = createTypeRegistryManager();
scan(manager)(source);

console.dir(manager.getRegistry(), { depth: 5 });
