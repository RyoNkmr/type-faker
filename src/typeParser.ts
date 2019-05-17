import ts, { isTypeAliasDeclaration } from "typescript";
import { decorator } from "@babel/types";

type Maybe<T> = T | undefined;
type TypeName = string;
type Registry = Record<TypeName, TypeDefinition>;
type TypeDefinition = { types: TypeName[] } | { props: Registry };
type Registerer = (type: TypeName, definition: TypeDefinition) => void;
type RegistryManager = {
  getRegistry: () => Registry;
  register: Registerer;
  isUnregisteredTypeName: (type: TypeName) => boolean;
  isUnregisteredNode: (type: ts.Node) => boolean;
};

const createTypeRegistryManager = (
  typeChecker: ts.TypeChecker
): RegistryManager => {
  let registry: Registry = {};
  const register: Registerer = (type: TypeName, definition: TypeDefinition) => {
    registry = { ...registry, [type]: definition };
  };
  const isUnregisteredTypeName = (type: TypeName) =>
    !registry.hasOwnProperty(type);
  const isUnregisteredNode = (node: ts.Node) =>
    isUnregisteredTypeName(
      typeChecker.typeToString(typeChecker.getTypeAtLocation(node))
    );

  return {
    getRegistry: () => registry,
    isUnregisteredTypeName,
    isUnregisteredNode,
    register
  };
};

export const initializeEnvironment = (
  sourcePath: string,
  otherSources: string[] = [],
  compilerOptions = {}
) => {
  const program = ts.createProgram(
    [sourcePath, ...otherSources],
    compilerOptions
  );
  const typeChecker = program.getTypeChecker();
  const source = program.getSourceFile(sourcePath);
  const manager = createTypeRegistryManager(typeChecker);
  return {
    program,
    typeChecker,
    source,
    manager
  };
};

const createTypeStringsParser = (typeChecker: ts.TypeChecker) => (
  type: ts.Type,
  node?: ts.Node
) =>
  (type.isUnionOrIntersection() ? type.types : [type]).map(type =>
    typeChecker.typeToString(type, node)
  );

const createPropsParser = (typeChecker: ts.TypeChecker) => (
  node: ts.InterfaceDeclaration | ts.TypeLiteralNode
): Registry => {
  const getProps = createPropsParser(typeChecker);
  const getTypeStrings = createTypeStringsParser(typeChecker);
  return node.members
    .filter(
      (prop): prop is ts.PropertySignature => ts.isPropertySignature(prop)
    )
    .reduce((props, prop) => {
      const key = ts.isIdentifier(prop.name) && ts.idText(prop.name);
      if (!key || !prop.type) {
        return props;
      }
      const base = prop.questionToken ? ["undefined"] : [];

      if (ts.isTypeReferenceNode(prop.type)) {
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
          }
        };
      }
      if (
        ts.isUnionTypeNode(prop.type) ||
        ts.isIntersectionTypeNode(prop.type)
      ) {
        const types = prop.type.types.map(typeNode =>
          typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode))
        );
        return {
          ...props,
          [key]: {
            types: [...types, ...base]
          }
        };
      }

      const types = getTypeStrings(typeChecker.getTypeAtLocation(prop), prop);
      return {
        ...props,
        [key]: {
          types: [...types, ...base]
        }
      };
    }, {});
};

export const scan = (
  typeChecker: ts.TypeChecker,
  registryManager: RegistryManager
) => {
  const getProps = createPropsParser(typeChecker);
  const executor = (node?: ts.Node): void => {
    if (node === undefined) {
      return;
    }
    if (ts.isSourceFile(node)) {
      return ts.forEachChild(node, executor);
    }

    if (ts.isInterfaceDeclaration(node)) {
      const id = ts.idText(node.name);
      return registryManager.register(id, {
        props: getProps(node)
      });
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const { name, type } = node;
      const id = ts.idText(name);

      if (ts.isTypeLiteralNode(type)) {
        return registryManager.register(id, {
          props: getProps(type)
        });
      }
      const types = (ts.isUnionTypeNode(type) ? type.types : [type]).map(t =>
        typeChecker.typeToString(typeChecker.getTypeFromTypeNode(t))
      );
      registryManager.register(id, {
        types
      });
    }
    ts.forEachChild(node, executor);
  };
  return executor;
};
