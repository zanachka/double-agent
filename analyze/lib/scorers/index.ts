export abstract class Scorer {}

export class Binary extends Scorer {}
export class DiffGradient extends Scorer {}
export class ProgressiveGradient extends Scorer {}
