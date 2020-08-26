import { GemVersion, MaybeGemVersion } from './ruby/gem-version';

export { valid, prerelease, major, minor, patch, inc };

type Segment = string | number;

const inc = (): never => {
  throw new Error('Not implemented');
};

function valid(v: MaybeGemVersion): string | null {
  if (!v) {
    return null;
  }

  try {
    return GemVersion.create(v).toString();
  } catch (err) {
    return null;
  }
}

function prerelease(v: MaybeGemVersion): Segment[] | null {
  try {
    const version = GemVersion.create(v);
    if (version.isPrerelease()) {
      const segments = version.getSegments();
      const preStartIndex = segments.findIndex(
        (s) => typeof s === 'string' && /[a-zA-Z]/.test(s),
      );
      return segments.slice(preStartIndex);
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

function _segmentAt(v, index): Segment | null {
  try {
    const segment = GemVersion.create(v).getSegments()[index];
    return segment === undefined ? null : segment;
  } catch (err) {
    return null;
  }
}

function major(v: MaybeGemVersion): Segment | null {
  return _segmentAt(v, 0);
}

function minor(v: MaybeGemVersion): Segment | null {
  return _segmentAt(v, 1);
}

function patch(v: MaybeGemVersion): Segment | null {
  return _segmentAt(v, 2);
}
