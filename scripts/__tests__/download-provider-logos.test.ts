import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {afterEach, describe, expect, it} from 'vitest';
import {
  buildLogoFilename,
  buildLogoUrl,
  downloadProviderLogos,
  extractUniqueProviderNames,
  LOGO_API_URL,
  MODELS_API_URL,
  type FetchFn,
  type FetchResponse,
} from '../download-provider-logos';

// Creates a JSON fetch response for deterministic, offline tests.
function createJsonResponse(payload: unknown): FetchResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => payload,
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

// Creates an SVG fetch response that returns bytes for file-write assertions.
function createSvgResponse(svg: string): FetchResponse {
  const bytes = Buffer.from(svg, 'utf-8');

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

const tempDirectories: string[] = [];

describe('download-provider-logos script', () => {
  afterEach(async () => {
    for (const tempDirectory of tempDirectories.splice(0, tempDirectories.length)) {
      await fs.rm(tempDirectory, {recursive: true, force: true});
    }
  });

  it('extracts unique provider names from top-level keys', () => {
    const providers = extractUniqueProviderNames({
      openai: {},
      anthropic: {},
      ' openai ': {duplicate: true},
      xai: {},
    });

    expect(providers).toEqual(['anthropic', 'openai', 'xai']);
  });

  it('throws when models payload is not a top-level object', () => {
    expect(() => extractUniqueProviderNames([])).toThrow(
      'Expected models.dev response to be a top-level JSON object.'
    );
  });

  it('downloads one logo per provider into the output directory', async () => {
    const outputDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'download-provider-logos-test-')
    );
    tempDirectories.push(outputDirectory);

    const fetchFn: FetchFn = async input => {
      if (input === MODELS_API_URL) {
        return createJsonResponse({
          openai: {},
          anthropic: {},
        });
      }

      if (input === `${LOGO_API_URL}/anthropic.svg`) {
        return createSvgResponse('<svg>anthropic</svg>');
      }

      if (input === `${LOGO_API_URL}/openai.svg`) {
        return createSvgResponse('<svg>openai</svg>');
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    };

    const summary = await downloadProviderLogos({
      outputDirectory,
      fetchFn,
      logger: {log: () => {}, warn: () => {}, error: () => {}},
    });

    expect(summary.providers).toEqual(['anthropic', 'openai']);
    expect(summary.failed).toEqual([]);
    expect(summary.downloaded).toHaveLength(2);

    const anthropicLogoPath = path.join(outputDirectory, buildLogoFilename('anthropic'));
    const openaiLogoPath = path.join(outputDirectory, buildLogoFilename('openai'));

    await expect(fs.readFile(anthropicLogoPath, 'utf-8')).resolves.toBe(
      '<svg>anthropic</svg>'
    );
    await expect(fs.readFile(openaiLogoPath, 'utf-8')).resolves.toBe('<svg>openai</svg>');
  });

  it('continues when one logo download fails', async () => {
    const outputDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'download-provider-logos-test-')
    );
    tempDirectories.push(outputDirectory);

    const fetchFn: FetchFn = async input => {
      if (input === MODELS_API_URL) {
        return createJsonResponse({
          openai: {},
          anthropic: {},
        });
      }

      if (input === buildLogoUrl('anthropic')) {
        return createSvgResponse('<svg>anthropic</svg>');
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    };

    const summary = await downloadProviderLogos({
      outputDirectory,
      fetchFn,
      logger: {log: () => {}, warn: () => {}, error: () => {}},
    });

    expect(summary.providers).toEqual(['anthropic', 'openai']);
    expect(summary.downloaded).toHaveLength(1);
    expect(summary.failed).toEqual([
      {
        provider: 'openai',
        reason: 'Logo request failed for "openai" (404 Not Found)',
      },
    ]);

    const anthropicLogoPath = path.join(outputDirectory, buildLogoFilename('anthropic'));
    await expect(fs.readFile(anthropicLogoPath, 'utf-8')).resolves.toBe(
      '<svg>anthropic</svg>'
    );
  });
});
