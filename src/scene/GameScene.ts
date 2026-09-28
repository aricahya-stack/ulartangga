import * as pc from 'playcanvas';
import { Board } from '../game/Board';
import { Dice } from '../game/Dice';
import { LADDERS, SNAKES } from '../game/TileEvent';
import { BoardFactory } from './BoardFactory';
import { LadderFactory } from './LadderFactory';
import { MaterialFactory, type PawnMaterialStyle } from './MaterialFactory';
import { PawnFactory, type PawnVisual } from './PawnFactory';
import { SnakeFactory } from './SnakeFactory';
import { FinalTileEffects } from '../effects/FinalTileEffects';

export class GameScene {
  readonly board = new Board();
  readonly materials = new MaterialFactory();
  readonly dice: Dice;
  readonly pawns: [PawnVisual, PawnVisual];
  private readonly pawnFactory: PawnFactory;

  constructor(readonly app: pc.Application) {
    this.materials.loadProceduralTextures(app);
    new BoardFactory(app, this.board, this.materials).create();

    const ladderFactory = new LadderFactory(app, this.materials);
    for (const [from, to] of LADDERS) {
      ladderFactory.create(`Ladder ${from}-${to}`, this.board.tilePosition(from), this.board.tilePosition(to));
    }

    const snakeFactory = new SnakeFactory(app, this.materials);
    for (const [from, to] of SNAKES) {
      snakeFactory.create(`Snake ${from}-${to}`, this.board.tilePosition(from), this.board.tilePosition(to));
    }

    this.pawnFactory = new PawnFactory(this.materials);
    const blue = this.pawnFactory.create('Player A Pawn', new pc.Color(0.10, 0.46, 0.98), 'glossy');
    const red = this.pawnFactory.create('Player B Pawn', new pc.Color(0.94, 0.17, 0.27), 'glossy');
    app.root.addChild(blue.root);
    app.root.addChild(red.root);
    this.pawns = [blue, red];
    this.dice = new Dice(app, this.materials);
    new FinalTileEffects(app, this.board.tilePosition(50));

  }

  setPawnMaterials(a: PawnMaterialStyle, b: PawnMaterialStyle) {
    this.pawnFactory.applyStyle(this.pawns[0], a);
    this.pawnFactory.applyStyle(this.pawns[1], b);
  }
}
