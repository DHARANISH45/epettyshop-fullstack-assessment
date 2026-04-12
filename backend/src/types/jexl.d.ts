declare module 'jexl' {
  interface Jexl {
    eval(expression: string, context?: Record<string, any>): Promise<any>;
    evalSync(expression: string, context?: Record<string, any>): any;
    addTransform(name: string, fn: (...args: any[]) => any): void;
    addFunction(name: string, fn: (...args: any[]) => any): void;
    addBinaryOp(operator: string, precedence: number, fn: (left: any, right: any) => any): void;
    addUnaryOp(operator: string, fn: (right: any) => any): void;
  }

  const jexl: Jexl;
  export default jexl;
}
