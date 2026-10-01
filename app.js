/* --------------------------------------------------------------------------
   dimms — the whole of the site's JavaScript.

   1. Keeps the footer year current.
   2. Fills in Maestro's version from the latest tag on GitHub, and points
      each download button at its file in the latest release, so a release
      never needs the page edited.

   Everything here is progressive enhancement: if the request fails, is rate
   limited, or JavaScript is off, the page reads perfectly well without a
   version number, and the download buttons lead to the releases page.
   -------------------------------------------------------------------------- */

const REPO = "dimms0/maestro";
const CACHE_KEY = "dimms:maestro-release";
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours — GitHub allows 60 anonymous requests an hour

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  showLatestRelease();
});

async function showLatestRelease() {
  const versions = document.querySelectorAll("[data-version]");
  const links = document.querySelectorAll("[data-release-link]");
  const downloads = document.querySelectorAll("[data-asset]");
  if (!versions.length && !links.length && !downloads.length) return;

  const release = readCache() || writeCache(await fetchLatestRelease());
  if (!release) return;

  // Tags are written v0.1.0; the prose around them already says "Version".
  const version = release.tag.replace(/^v/, "");

  versions.forEach((el) => {
    el.textContent = version;
  });

  links.forEach((el) => {
    if (release.url) el.href = release.url;
    el.hidden = false;
  });

  // Asset names carry the version, so match on the rest of the name. A build
  // missing from the release keeps its link to the releases page.
  downloads.forEach((el) => {
    const asset = release.assets.find((a) => a.name.endsWith(el.dataset.asset));
    if (asset) el.href = asset.url;
  });
}

/* Published releases first — they carry a page to link to. A repository that
   is tagged but has nothing published yet falls back to the tag list. */
async function fetchLatestRelease() {
  const api = `https://api.github.com/repos/${REPO}`;
  const options = { headers: { Accept: "application/vnd.github+json" } };

  try {
    const latest = await fetch(`${api}/releases/latest`, options);

    if (latest.ok) {
      const release = await latest.json();
      if (release.tag_name) {
        return {
          tag: release.tag_name,
          url: release.html_url,
          assets: (release.assets || []).map((asset) => ({
            name: asset.name,
            url: asset.browser_download_url,
          })),
        };
      }
    } else if (latest.status !== 404) {
      return null; // rate limited, or the repository is not reachable
    }

    const tags = await fetch(`${api}/tags?per_page=100`, options);
    if (!tags.ok) return null;

    const tag = newestTag(await tags.json());
    if (!tag) return null;

    return {
      tag,
      url: `https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`,
      assets: [],
    };
  } catch {
    return null; // offline, blocked, or malformed response
  }
}

/* The tag list comes back in no documented order, so compare the version
   numbers ourselves rather than trusting the first entry. */
function newestTag(tags) {
  if (!Array.isArray(tags)) return null;

  return tags
    .map((tag) => tag && tag.name)
    .filter((name) => typeof name === "string" && /^v?\d+(\.\d+)*$/.test(name))
    .sort((a, b) => {
      const left = parts(a);
      const right = parts(b);
      for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const diff = (right[i] || 0) - (left[i] || 0);
        if (diff) return diff;
      }
      return 0;
    })[0] || null;
}

function parts(tag) {
  return tag.replace(/^v/, "").split(".").map(Number);
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!cached || !cached.tag || !Array.isArray(cached.assets)) return null;
    if (Date.now() - cached.at > CACHE_MAX_AGE) return null;
    return cached;
  } catch {
    return null; // no storage, or something else wrote over the key
  }
}

function writeCache(release) {
  if (!release) return null;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...release, at: Date.now() })
    );
  } catch {
    // storage disabled or full — the version still shows, it just refetches
  }
  return release;
}
