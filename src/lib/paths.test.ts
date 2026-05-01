import { describe, expect, it } from "vitest";

import {
  getRelativePath,
  normalizePath,
  normalizeWindowsPathPrefix,
  shortenPath,
} from "./paths";

describe("path utilities", () => {
  it("normalizes Windows extended path prefixes", () => {
    expect(normalizeWindowsPathPrefix(String.raw`\\?\C:\DAO\override`)).toBe(
      String.raw`C:\DAO\override`,
    );
    expect(
      normalizeWindowsPathPrefix(String.raw`\\?\UNC\server\share\override`),
    ).toBe(String.raw`\\server\share\override`);
  });

  it("normalizes separators and preserves UNC roots", () => {
    expect(normalizePath("C:\\DAO\\\\packages\\core\\override\\")).toBe(
      "C:/DAO/packages/core/override",
    );
    expect(normalizePath(String.raw`\\server\share\DAO\override`)).toBe(
      "//server/share/DAO/override",
    );
  });

  it("shortens long Windows paths without dropping the drive", () => {
    expect(
      shortenPath(
        String.raw`\\?\C:\Users\Azganoth\Documents\BioWare\Dragon Age\packages\core\override`,
      ),
    ).toBe("C:/.../Dragon Age/packages/core/override");
  });

  it("shortens long UNC paths without dropping the server and share", () => {
    expect(
      shortenPath(
        String.raw`\\?\UNC\server\share\BioWare\Dragon Age\packages\core\override`,
      ),
    ).toBe("//server/share/.../Dragon Age/packages/core/override");
  });

  it("does not shorten root-only paths", () => {
    expect(shortenPath("/")).toBe("/");
  });

  it("shortens long non-drive absolute paths with an absolute marker", () => {
    expect(
      shortenPath(
        "/home/test/Documents/BioWare/Dragon Age/packages/core/override",
      ),
    ).toBe("/.../Dragon Age/packages/core/override");
  });

  it("returns normalized relative paths below a base path", () => {
    expect(
      getRelativePath(
        String.raw`C:\DAO\packages\core\override\Some Mod\file.gda`,
        String.raw`c:\dao\packages\core\override`,
      ),
    ).toBe("Some Mod/file.gda");
  });

  it("returns an empty relative path when both paths are the same", () => {
    expect(
      getRelativePath(
        "C:\\DAO\\packages\\core\\override\\",
        "C:/DAO/packages/core/override",
      ),
    ).toBe("");
  });

  it("does not treat paths with the same prefix as descendants", () => {
    expect(
      getRelativePath(
        "C:/DAO/packages/core/override-extra/file.gda",
        "C:/DAO/packages/core/override",
      ),
    ).toBe("C:/DAO/packages/core/override-extra/file.gda");
  });

  it("returns the normalized absolute path when outside the base path", () => {
    expect(
      getRelativePath(
        String.raw`D:\DAO\packages\core\override\file.gda`,
        String.raw`C:\DAO\packages\core\override`,
      ),
    ).toBe("D:/DAO/packages/core/override/file.gda");
  });
});
