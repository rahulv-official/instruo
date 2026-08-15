import { describe, expect, it } from "vitest";
import {
  formatMarkup,
  formatScript,
  jsonToYaml,
  relativeLuminance,
} from "../app/utils/browser-tools";

describe("browser tool primitives", () => {
  it("formats markup without changing tag order", () => {
    expect(formatMarkup("<main><p>Hello</p></main>")).toBe("<main>\n  <p>Hello</p>\n</main>");
  });

  it("formats a small script and supports minification", () => {
    expect(formatScript("const answer = 42;", true)).toBe("const answer = 42;");
    expect(formatScript("if (true) { answer(); }")).toContain("answer();");
  });

  it("serializes nested JSON values to YAML", () => {
    expect(jsonToYaml({ name: "Instruo", enabled: true })).toBe("name: Instruo\nenabled: true");
  });

  it("calculates a brighter luminance for white than black", () => {
    expect(relativeLuminance("#ffffff")).toBeGreaterThan(relativeLuminance("#000000"));
  });
});
