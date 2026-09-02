const fileInput = document.querySelector('#file-upload');
const dropZone = document.querySelector('#drop-zone');
const selectedFiles = document.querySelector('#selected-files');
const compareButton = document.querySelector('#find-out-now');
const clearButton = document.querySelector('#clear-files');
const statusMessage = document.querySelector('#status-message');
const results = document.querySelector('#results');
const resultCount = document.querySelector('#result-count');
const resultList = document.querySelector('#result-list');
const resultExplainer = document.querySelector('#result-explainer');
const emptyResult = document.querySelector('#empty-result');
const downloadButton = document.querySelector('#download-follower-info');

let currentResults = [];
let selected = [];
let historyFile = null;

function isSupported(file) { return /\.(html|json|txt)$/i.test(file.name); }
function escapeHtml(value) { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function renderFiles() {
  selectedFiles.innerHTML = '';
  selectedFiles.hidden = selected.length === 0;
  clearButton.hidden = selected.length === 0;
  selected.forEach(file => {
    const chip = document.createElement('span');
    chip.className = 'file-chip';
    chip.innerHTML = `<span aria-hidden="true">✓</span>${escapeHtml(file.name)}`;
    selectedFiles.append(chip);
  });
}
function setFiles(files) {
  selected = [...files].filter(isSupported);
  historyFile = selected.find(file => /^known-following-\d{4}-\d{2}-\d{2}\.txt$/i.test(file.name)) || null;
  results.hidden = true;
  statusMessage.textContent = selected.length !== [...files].length ? 'Only .html, .json, and known-following .txt files can be used.' : '';
  renderFiles();
}
function requireFiles() {
  const html = selected.filter(file => /\.html$/i.test(file.name));
  const json = selected.filter(file => /\.json$/i.test(file.name));
  const find = (files, name) => files.find(file => file.name.toLowerCase() === name);
  const htmlPair = [find(html, 'followers_1.html'), find(html, 'following.html')];
  const jsonPair = [find(json, 'followers_1.json'), find(json, 'following.json')];
  if (htmlPair.every(Boolean) && json.length === 0) return { type: 'html', files: htmlPair };
  if (jsonPair.every(Boolean) && html.length === 0) return { type: 'json', files: jsonPair };
  throw new Error('Select either followers_1.html and following.html, or followers_1.json and following.json. You may also add one previous known-following file.');
}
function usernamesFromHtml(markup) {
  const documentCopy = new DOMParser().parseFromString(markup, 'text/html');
  return [...documentCopy.querySelectorAll('a[href*="instagram.com/"]')]
    .map(link => usernameFromInstagramUrl(link.href))
    .filter(Boolean);
}
function usernameFromInstagramUrl(href) {
  try {
    const url = new URL(href);
    const segments = url.pathname.split('/').filter(Boolean);
    const legacyProfileMarker = segments.findIndex(segment => segment.toLowerCase() === '_u');
    const username = legacyProfileMarker >= 0 ? segments[legacyProfileMarker + 1] : segments[0];
    return username ? decodeURIComponent(username).replace(/^@/, '') : null;
  } catch {
    return null;
  }
}
function usernamesFromJson(data, following) {
  const source = following ? data.relationships_following : data;
  if (!Array.isArray(source)) throw new Error('That JSON export does not have the expected Instagram format.');
  return source.flatMap(item => (item.string_list_data || []).map(detail => detail.value)).filter(Boolean);
}
async function compareFiles() {
  statusMessage.textContent = '';
  try {
    const source = requireFiles();
    compareButton.disabled = true;
    compareButton.textContent = 'Comparing…';
    const [followersRaw, followingRaw] = await Promise.all(source.files.map(file => file.text()));
    const followers = source.type === 'html' ? usernamesFromHtml(followersRaw) : usernamesFromJson(JSON.parse(followersRaw), false);
    const following = source.type === 'html' ? usernamesFromHtml(followingRaw) : usernamesFromJson(JSON.parse(followingRaw), true);
    const followerSet = new Set(followers);
    let difference = [...new Set(following.filter(name => !followerSet.has(name)))].sort((a, b) => a.localeCompare(b));
    if (historyFile) {
      const previous = new Set((await historyFile.text()).split(/\r?\n/).map(name => name.trim().replace(/^@/, '')).filter(Boolean));
      difference = difference.filter(name => !previous.has(name));
      resultExplainer.textContent = 'Showing accounts that were not in your previous saved list.';
    } else resultExplainer.textContent = 'These accounts appear in your following export but not in your followers export.';
    currentResults = difference;
    renderResults();
  } catch (error) {
    statusMessage.textContent = error.message || 'We could not read those files. Please try your Instagram export again.';
  } finally {
    compareButton.disabled = false;
    compareButton.textContent = 'Compare files';
  }
}
function renderResults() {
  resultCount.textContent = currentResults.length;
  resultList.innerHTML = '';
  emptyResult.hidden = currentResults.length !== 0;
  currentResults.forEach(username => { const item = document.createElement('li'); item.textContent = username; resultList.append(item); });
  downloadButton.hidden = currentResults.length === 0;
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function downloadResults() {
  const today = new Date().toISOString().slice(0, 10);
  const createDownload = contents => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([contents.join('\n')], { type: 'text/plain' }));
    link.download = `known-following-${today}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  if (historyFile) historyFile.text().then(text => createDownload([...new Set([...text.split(/\r?\n/).filter(Boolean), ...currentResults])]));
  else createDownload(currentResults);
}

fileInput.addEventListener('change', event => setFiles(event.target.files));
['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone.addEventListener('drop', event => setFiles(event.dataTransfer.files));
compareButton.addEventListener('click', compareFiles);
clearButton.addEventListener('click', () => { selected = []; historyFile = null; currentResults = []; fileInput.value = ''; results.hidden = true; statusMessage.textContent = ''; renderFiles(); });
downloadButton.addEventListener('click', downloadResults);
