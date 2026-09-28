export class TurnManager {
  private index = 0;
  get current() { return this.index; }
  next() { this.index = this.index === 0 ? 1 : 0; return this.index; }
  reset() { this.index = 0; }
}
