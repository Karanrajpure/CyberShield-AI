import { describe, expect, it } from "vitest";
import { stageAt, storyFrame } from "@/components/three/story";

describe("scroll story", () => {
  it("maps progress to five sections", () => {
    expect(stageAt(0)).toBe(0);
    expect(stageAt(0.45)).toBe(2);
    expect(stageAt(1)).toBe(4);
  });
  it("shield rotates ~180° in section 2", () => {
    expect(storyFrame(0.4).shieldRotY).toBeCloseTo(Math.PI);
  });
  it("shield returns to its original position at the end", () => {
    const end = storyFrame(1);
    expect(end.shieldZ).toBeCloseTo(0);
    expect(end.cameraZ).toBeCloseTo(7);
    expect(end.threats).toBe(0);
  });
  it("threats only appear in the detection section", () => {
    expect(storyFrame(0.3).threats).toBe(0);
    expect(storyFrame(0.7).threats).toBe(1);
  });
});
