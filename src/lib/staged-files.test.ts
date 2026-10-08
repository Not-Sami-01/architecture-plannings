import { describe, expect, it } from "vitest";

import { FILE_LIMITS } from "@/config/constants";

import { stageFiles, type StagedFile } from "./staged-files";

function makeFile(name: string, type: string, bytes = 100): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("stageFiles", () => {
  it("accepts supported files with unique keys", () => {
    const { staged, rejected } = stageFiles([], [
      makeFile("plot.jpg", "image/jpeg"),
      makeFile("sketch.pdf", "application/pdf"),
    ]);

    expect(rejected).toHaveLength(0);
    expect(staged).toHaveLength(2);
    expect(staged.map((file) => file.name)).toEqual(["plot.jpg", "sketch.pdf"]);
    expect(staged[0].key).not.toBe(staged[1].key);
    expect(staged[0].mime).toBe("image/jpeg");
    expect(staged[0].size).toBe(100);
  });

  it("rejects unsupported types with a reason", () => {
    const { staged, rejected } = stageFiles([], [makeFile("anim.gif", "image/gif")]);

    expect(staged).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].name).toBe("anim.gif");
    expect(rejected[0].reason).toMatch(/JPG, PNG or PDF/);
  });

  it("rejects empty and oversized files", () => {
    const { staged, rejected } = stageFiles([], [
      makeFile("empty.jpg", "image/jpeg", 0),
      makeFile("huge.png", "image/png", FILE_LIMITS.clientMaxSizeBytes + 1),
    ]);

    expect(staged).toHaveLength(0);
    expect(rejected.map((entry) => entry.reason)).toEqual([
      "File is empty.",
      expect.stringContaining("Too large"),
    ]);
  });

  it("keeps existing files and appends new ones in order", () => {
    const existing: StagedFile[] = [
      { key: "a", file: makeFile("a.jpg", "image/jpeg"), name: "a.jpg", size: 1, mime: "image/jpeg" },
    ];

    const { staged } = stageFiles(existing, [makeFile("b.jpg", "image/jpeg")]);

    expect(staged.map((file) => file.name)).toEqual(["a.jpg", "b.jpg"]);
  });

  it("stops accepting at the per-order file limit", () => {
    const full = Array.from({ length: FILE_LIMITS.maxClientFiles }, (_, index) => ({
      key: `k${index}`,
      file: makeFile(`f${index}.jpg`, "image/jpeg"),
      name: `f${index}.jpg`,
      size: 1,
      mime: "image/jpeg",
    }));

    const { staged, rejected } = stageFiles(full, [makeFile("extra.jpg", "image/jpeg")]);

    expect(staged).toHaveLength(FILE_LIMITS.maxClientFiles);
    expect(rejected[0].reason).toMatch(/Limit reached/);
  });
});
