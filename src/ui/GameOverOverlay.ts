// ============================================================
// GameOverOverlay.ts — scale-only button hover
// ============================================================

import Phaser from "phaser";

export class GameOverOverlay {
  private scene: Phaser.Scene;
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    woodDelivered: number,
    requiredWood: number,
    onPlayAgain: () => void,
    onMainMenu: () => void,
  ) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const cx = W / 2;

    const overlay = scene.add.rectangle(cx, H / 2, W, H, 0x111111, 0.88)
      .setScrollFactor(0).setDepth(100);
    this.elements.push(overlay);

    const title = scene.add.text(cx, H * 0.22, "GAME OVER", {
      fontSize: "50px", fontFamily: "Fredoka One, Nunito, sans-serif",
      color: "#ff3333", stroke: "#660000", strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.elements.push(title);

    const sub = scene.add.text(cx, H * 0.34, "ዳመራው ካልበራ ዓመቱ እንዴት ሊበራ ነው?", {
      fontSize: "28px", fontFamily: "Nunito, sans-serif", color: "#cccccc",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.elements.push(sub);

    const progress = scene.add.text(cx, H * 0.44,
      `Wood: ${woodDelivered} / ${requiredWood}\nTime: 00:00`, {
      fontSize: "18px", fontFamily: "Nunito, sans-serif",
      color: "#aaaaaa", align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.elements.push(progress);

    this.makeButton(scene, cx, H * 0.60, "PLAY AGAIN", 0x2e7d32, onPlayAgain);
    this.makeButton(scene, cx, H * 0.73, "MAIN MENU", 0x424242, onMainMenu);
  }

  private makeButton(scene: Phaser.Scene, x: number, y: number, label: string, color: number, cb: () => void): void {
    const btnW = 220, btnH = 54;

    const gfx = scene.add.graphics().setScrollFactor(0).setDepth(101);
    gfx.fillStyle(color);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

    const txt = scene.add.text(0, 0, label, {
      fontSize: "20px", fontFamily: "Fredoka One, Nunito, sans-serif", color: "#ffffff",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    const btn = scene.add.container(x, y, [gfx, txt]);
    btn.setSize(btnW, btnH).setScrollFactor(0).setDepth(101);
    btn.setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => { scene.tweens.add({ targets: btn, scale: 1.06, duration: 80 }); });
    btn.on("pointerout", () => { scene.tweens.add({ targets: btn, scale: 1.00, duration: 80 }); });
    btn.on("pointerdown", () => { scene.tweens.add({ targets: btn, scale: 0.96, duration: 60 }); });
    btn.on("pointerup", cb);

    this.elements.push(btn);
  }

  destroy(): void {
    this.elements.forEach(e => e.destroy());
    this.elements = [];
  }
}